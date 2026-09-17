using FluentAssertions;
using Nexora.Application.Inventory.Queries.GetCategories;
using Nexora.Application.Inventory.Queries.GetUnits;
using Nexora.Domain.Identity;
using Nexora.Domain.Inventory;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Inventory;

public class InventoryLookupTests
{
    [Fact]
    public async Task GetCategories_ReturnsRealSeededData_NotAHardcodedList()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        db.ProductCategories.Add(new ProductCategory { OrganizationId = org.Id, Name = "Beverages" });
        db.ProductCategories.Add(new ProductCategory { OrganizationId = org.Id, Name = "Snacks" });
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var handler = new GetCategoriesQueryHandler(db);
        var result = await handler.Handle(new GetCategoriesQuery(), default);

        result.Should().HaveCount(2);
        result.Select(c => c.Name).Should().Contain(new[] { "Beverages", "Snacks" });
    }

    [Fact]
    public async Task GetUnits_ReturnsRealSeededData()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        db.Units.Add(new Unit { OrganizationId = org.Id, Name = "Pieces", Abbreviation = "pcs" });
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var handler = new GetUnitsQueryHandler(db);
        var result = await handler.Handle(new GetUnitsQuery(), default);

        result.Should().ContainSingle(u => u.Abbreviation == "pcs");
    }
}
