using FluentAssertions;
using Nexora.Domain.Identity;
using Nexora.Domain.Inventory;
using Nexora.Domain.Sync;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Sync;

public class SyncOutboxCaptureTests
{
    [Fact]
    public async Task CreatingAProduct_AutomaticallyWritesAnOutboxEvent()
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
            CategoryId = category.Id, UnitId = unit.Id, Version = 1,
        };
        db.Products.Add(product);

        await db.SaveChangesAsync();

        var outboxEvent = db.SyncOutboxEvents.Single();
        outboxEvent.AggregateType.Should().Be("Product");
        outboxEvent.EventType.Should().Be(SyncEventType.Created);
        outboxEvent.Version.Should().Be(1);
    }

    [Fact]
    public async Task UpdatingAProduct_IncrementsVersionAndWritesASecondOutboxEvent()
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
            CategoryId = category.Id, UnitId = unit.Id, Version = 1,
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        product.SellingPrice = 150;
        await db.SaveChangesAsync();

        db.SyncOutboxEvents.Should().HaveCount(2);
        product.Version.Should().Be(2);
        db.SyncOutboxEvents.OrderBy(e => e.Version).Last().EventType.Should().Be(SyncEventType.Updated);
    }
}
