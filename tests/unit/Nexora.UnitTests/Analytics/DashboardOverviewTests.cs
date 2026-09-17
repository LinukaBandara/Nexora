using FluentAssertions;
using Nexora.Application.Analytics.Queries.GetDashboardOverview;
using Nexora.Domain.Identity;
using Nexora.Domain.Inventory;
using Nexora.Domain.Sales;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Analytics;

public class DashboardOverviewTests
{
    [Fact]
    public async Task Dashboard_AggregatesRevenueAndLowStock_AcrossModules()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);

        var category = new ProductCategory { OrganizationId = org.Id, Name = "General" };
        var unit = new Unit { OrganizationId = org.Id, Name = "Pieces", Abbreviation = "pcs" };
        db.ProductCategories.Add(category);
        db.Units.Add(unit);

        var product = new Product
        {
            OrganizationId = org.Id, Sku = "SKU-1", Name = "Widget",
            CategoryId = category.Id, UnitId = unit.Id, CostPrice = 10, ReorderLevel = 20,
        };
        db.Products.Add(product);

        var warehouse = new Warehouse { OrganizationId = org.Id, Name = "Main" };
        db.Warehouses.Add(warehouse);

        db.InventoryItems.Add(new InventoryItem
        {
            OrganizationId = org.Id, ProductId = product.Id, WarehouseId = warehouse.Id, QuantityOnHand = 5,
        });

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var invoice = new Invoice
        {
            OrganizationId = org.Id, Number = "INV-1", CustomerId = Guid.NewGuid(), SalesOrderId = Guid.NewGuid(),
            Total = 1500, IssueDate = today,
        };
        db.Invoices.Add(invoice);
        db.SalesOrders.Add(new SalesOrder
        {
            OrganizationId = org.Id, Number = "SO-1", CustomerId = invoice.CustomerId,
            WarehouseId = warehouse.Id, OrderDate = today, Total = 1500,
        });

        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var handler = new GetDashboardOverviewQueryHandler(db);
        var result = await handler.Handle(new GetDashboardOverviewQuery(today, today), default);

        result.Revenue.Should().Be(1500);
        result.OrderCount.Should().Be(1);
        result.InventoryValue.Should().Be(50);
        result.LowStockAlerts.Should().ContainSingle(a => a.ProductName == "Widget");
    }
}
