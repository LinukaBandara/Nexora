using FluentAssertions;
using Nexora.Application.Inventory.Common;
using Nexora.Application.Purchasing.Commands.ReceiveGoods;
using Nexora.Domain.Identity;
using Nexora.Domain.Inventory;
using Nexora.Domain.Purchasing;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Purchasing;

public class PurchasingWorkflowTests
{
    private static (Organization org, Domain.Inventory.Product product, Warehouse warehouse, Supplier supplier)
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
            CategoryId = category.Id, UnitId = unit.Id,
        };
        db.Products.Add(product);

        var warehouse = new Warehouse { OrganizationId = org.Id, Name = "Main" };
        db.Warehouses.Add(warehouse);

        var supplier = new Supplier { OrganizationId = org.Id, Name = "Acme Wholesale" };
        db.Suppliers.Add(supplier);

        return (org, product, warehouse, supplier);
    }

    [Fact]
    public async Task ReceiveGoods_OnUnapprovedOrder_Throws()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse, supplier) = SeedBasics(db);

        var order = new PurchaseOrder
        {
            OrganizationId = org.Id, Number = "PO-TEST-0001", SupplierId = supplier.Id,
            WarehouseId = warehouse.Id, Status = PurchaseOrderStatus.PendingApproval,
        };
        order.Items.Add(new PurchaseOrderItem
        {
            OrganizationId = org.Id, ProductId = product.Id, ProductNameSnapshot = product.Name,
            Quantity = 10, UnitCost = 50, LineTotal = 500,
        });
        db.PurchaseOrders.Add(order);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var recorder = new StockMovementRecorder(db);
        var handler = new ReceiveGoodsCommandHandler(db, currentUser, recorder);

        var act = () => handler.Handle(
            new ReceiveGoodsCommand(order.Id, new[] { new GoodsReceiptLineInput(order.Items.First().Id, 10) }, null),
            default);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*approved*");
    }

    [Fact]
    public async Task ReceiveGoods_OnApprovedOrder_AddsStockAndTracksPartialReceipt()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse, supplier) = SeedBasics(db);

        var order = new PurchaseOrder
        {
            OrganizationId = org.Id, Number = "PO-TEST-0002", SupplierId = supplier.Id,
            WarehouseId = warehouse.Id, Status = PurchaseOrderStatus.Approved,
        };
        order.Items.Add(new PurchaseOrderItem
        {
            OrganizationId = org.Id, ProductId = product.Id, ProductNameSnapshot = product.Name,
            Quantity = 10, UnitCost = 50, LineTotal = 500,
        });
        db.PurchaseOrders.Add(order);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var recorder = new StockMovementRecorder(db);
        var handler = new ReceiveGoodsCommandHandler(db, currentUser, recorder);

        // Receive only 6 of the 10 ordered - a split/partial delivery.
        await handler.Handle(
            new ReceiveGoodsCommand(order.Id, new[] { new GoodsReceiptLineInput(order.Items.First().Id, 6) }, null),
            default);

        db.InventoryItems.Single().QuantityOnHand.Should().Be(6);
        db.PurchaseOrders.Single().Status.Should().Be(PurchaseOrderStatus.PartiallyReceived);
        db.PurchaseOrders.Single().Items.Single().QuantityReceived.Should().Be(6);

        // Receiving the remaining 4 completes the order.
        var refreshedOrder = db.PurchaseOrders.Single();
        await handler.Handle(
            new ReceiveGoodsCommand(refreshedOrder.Id, new[] { new GoodsReceiptLineInput(refreshedOrder.Items.First().Id, 4) }, null),
            default);

        db.InventoryItems.Single().QuantityOnHand.Should().Be(10);
        db.PurchaseOrders.Single().Status.Should().Be(PurchaseOrderStatus.Received);
    }
}
