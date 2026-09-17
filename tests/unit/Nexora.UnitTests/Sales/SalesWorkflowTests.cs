using FluentAssertions;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Notifications;
using Nexora.Application.Inventory.Common;
using Nexora.Application.Sales.Commands.ApproveSalesOrder;
using Nexora.Application.Sales.Commands.CreateInvoiceFromSalesOrder;
using Nexora.Application.Sales.Commands.RecordPayment;
using Nexora.Domain.Identity;
using Nexora.Domain.Inventory;
using Nexora.Domain.Notifications;
using Nexora.Domain.Sales;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Sales;

public class SalesWorkflowTests
{
    private static (Organization org, Domain.Inventory.Product product, Warehouse warehouse, Customer customer)
        SeedBasics(Nexora.Infrastructure.Persistence.NexoraDbContext db)
    {
        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);

        var category = new ProductCategory { OrganizationId = org.Id, Name = "General" };
        var unit = new Unit { OrganizationId = org.Id, Name = "Pieces", Abbreviation = "pcs" };
        db.ProductCategories.Add(category);
        db.Units.Add(unit);

        var product = new Domain.Inventory.Product
        {
            OrganizationId = org.Id, Sku = "SKU-1", Name = "Widget",
            CategoryId = category.Id, UnitId = unit.Id, SellingPrice = 100,
        };
        db.Products.Add(product);

        var warehouse = new Warehouse { OrganizationId = org.Id, Name = "Main" };
        db.Warehouses.Add(warehouse);

        var customer = new Customer { OrganizationId = org.Id, Name = "ABC Traders", DefaultPaymentTermDays = 30 };
        db.Customers.Add(customer);

        return (org, product, warehouse, customer);
    }

    private static SalesOrder BuildApprovedOrder(Organization org, Customer customer, Warehouse warehouse,
        Domain.Inventory.Product product, int quantity, decimal unitPrice)
    {
        var order = new SalesOrder
        {
            OrganizationId = org.Id,
            Number = "SO-TEST-0001",
            CustomerId = customer.Id,
            WarehouseId = warehouse.Id,
            Status = SalesOrderStatus.Approved,
            Subtotal = quantity * unitPrice,
            Total = quantity * unitPrice,
        };
        order.Items.Add(new SalesOrderItem
        {
            OrganizationId = org.Id,
            ProductId = product.Id,
            ProductNameSnapshot = product.Name,
            Quantity = quantity,
            UnitPrice = unitPrice,
            LineTotal = quantity * unitPrice,
        });
        return order;
    }

    [Fact]
    public async Task ApproveSalesOrder_OnNonPendingOrder_Throws()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse, customer) = SeedBasics(db);
        var order = BuildApprovedOrder(org, customer, warehouse, product, 5, 100); // already Approved
        db.SalesOrders.Add(order);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var handler = new ApproveSalesOrderCommandHandler(db, currentUser);
        var act = () => handler.Handle(new ApproveSalesOrderCommand(order.Id), default);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*pending approval*");
    }

    [Fact]
    public async Task CreateInvoice_OnUnapprovedOrder_Throws()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse, customer) = SeedBasics(db);
        var order = BuildApprovedOrder(org, customer, warehouse, product, 5, 100);
        order.Status = SalesOrderStatus.PendingApproval; // not yet approved
        db.SalesOrders.Add(order);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var recorder = new StockMovementRecorder(db);
        var handler = new CreateInvoiceFromSalesOrderCommandHandler(db, currentUser, recorder, new NotificationService(db));

        var act = () => handler.Handle(
            new CreateInvoiceFromSalesOrderCommand(order.Id, new[] { new InvoiceLineInput(order.Items.First().Id, 5) }),
            default);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*approved*");
    }

    [Fact]
    public async Task CreateInvoice_WithInsufficientStock_ThrowsAndDoesNotPartiallyApply()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse, customer) = SeedBasics(db);
        var order = BuildApprovedOrder(org, customer, warehouse, product, 5, 100); // asking to ship 5
        db.SalesOrders.Add(order);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        // Only 2 in stock - not enough to fulfill 5.
        var recorder = new StockMovementRecorder(db);
        await recorder.RecordAsync(org.Id, product.Id, warehouse.Id, StockMovementType.Receipt, 2, null, null, null, default);
        await db.SaveChangesAsync();

        var handler = new CreateInvoiceFromSalesOrderCommandHandler(db, currentUser, recorder, new NotificationService(db));
        var act = () => handler.Handle(
            new CreateInvoiceFromSalesOrderCommand(order.Id, new[] { new InvoiceLineInput(order.Items.First().Id, 5) }),
            default);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*below zero*");

        // No invoice should have been persisted from the failed attempt.
        db.Invoices.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateInvoice_WithSufficientStock_DeductsStockAndMarksOrderInvoiced()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse, customer) = SeedBasics(db);
        var order = BuildApprovedOrder(org, customer, warehouse, product, 5, 100);
        db.SalesOrders.Add(order);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var recorder = new StockMovementRecorder(db);
        await recorder.RecordAsync(org.Id, product.Id, warehouse.Id, StockMovementType.Receipt, 10, null, null, null, default);
        await db.SaveChangesAsync();

        var handler = new CreateInvoiceFromSalesOrderCommandHandler(db, currentUser, recorder, new NotificationService(db));
        var invoiceId = await handler.Handle(
            new CreateInvoiceFromSalesOrderCommand(order.Id, new[] { new InvoiceLineInput(order.Items.First().Id, 5) }),
            default);

        invoiceId.Should().NotBeEmpty();
        db.InventoryItems.Single().QuantityOnHand.Should().Be(5); // 10 received - 5 shipped
        db.SalesOrders.Single().Status.Should().Be(SalesOrderStatus.Invoiced);
        db.Notifications.Should().BeEmpty(); // product's ReorderLevel defaults to 0; 5 remaining is not low stock
    }

    [Fact]
    public async Task CreateInvoice_DrivingStockAtOrBelowReorderLevel_FiresLowStockNotification()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse, customer) = SeedBasics(db);
        product.ReorderLevel = 10; // needs at least 10 on hand to be considered healthy

        var order = BuildApprovedOrder(org, customer, warehouse, product, 5, 100);
        db.SalesOrders.Add(order);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var recorder = new StockMovementRecorder(db);
        // Start with 15 on hand - shipping 5 leaves 10, which is AT the reorder level.
        await recorder.RecordAsync(org.Id, product.Id, warehouse.Id, StockMovementType.Receipt, 15, null, null, null, default);
        await db.SaveChangesAsync();

        var handler = new CreateInvoiceFromSalesOrderCommandHandler(db, currentUser, recorder, new NotificationService(db));
        await handler.Handle(
            new CreateInvoiceFromSalesOrderCommand(order.Id, new[] { new InvoiceLineInput(order.Items.First().Id, 5) }),
            default);

        db.InventoryItems.Single().QuantityOnHand.Should().Be(10);

        var notification = db.Notifications.Single();
        notification.Type.Should().Be(NotificationType.LowStock);
        notification.EntityId.Should().Be(product.Id);
    }

    [Fact]
    public async Task RecordPayment_ExceedingAmountDue_Throws()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, _, _, customer) = SeedBasics(db);
        var invoice = new Invoice
        {
            OrganizationId = org.Id,
            Number = "INV-TEST-0001",
            CustomerId = customer.Id,
            SalesOrderId = Guid.NewGuid(),
            Total = 500,
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var handler = new RecordPaymentCommandHandler(db, currentUser, new NotificationService(db));
        var act = () => handler.Handle(
            new RecordPaymentCommand(invoice.Id, 600, PaymentMethod.Cash, null, null), default);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*exceeds*");
    }

    [Fact]
    public async Task RecordPayment_InFull_MarksInvoicePaid()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, _, _, customer) = SeedBasics(db);
        var invoice = new Invoice
        {
            OrganizationId = org.Id,
            Number = "INV-TEST-0002",
            CustomerId = customer.Id,
            SalesOrderId = Guid.NewGuid(),
            Total = 500,
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var handler = new RecordPaymentCommandHandler(db, currentUser, new NotificationService(db));
        await handler.Handle(new RecordPaymentCommand(invoice.Id, 500, PaymentMethod.BankTransfer, "TXN-1", null), default);

        var updated = db.Invoices.Single();
        updated.Status.Should().Be(InvoiceStatus.Paid);
        updated.AmountDue.Should().Be(0);

        var notification = db.Notifications.Single();
        notification.Type.Should().Be(NotificationType.PaymentReceived);
        notification.EntityId.Should().Be(invoice.Id);
    }
}
