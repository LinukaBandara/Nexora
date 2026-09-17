using FluentAssertions;
using Nexora.Application.Inventory.Common;
using Nexora.Domain.Identity;
using Nexora.Domain.Inventory;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Inventory;

/// <summary>
/// Exercises the single most important invariant in the Inventory module:
/// StockMovementRecorder is the only path that changes InventoryItem.QuantityOnHand,
/// and it refuses to let stock go negative regardless of which caller is asking.
/// See spec section 15 ("For inventory, prefer transactional stock movements
/// rather than simply synchronizing a final stock number").
/// </summary>
public class StockMovementRecorderTests
{
    private static (Organization org, Product product, Warehouse warehouse) SeedBasics(
        Nexora.Infrastructure.Persistence.NexoraDbContext db)
    {
        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);

        var category = new ProductCategory { OrganizationId = org.Id, Name = "General" };
        var unit = new Unit { OrganizationId = org.Id, Name = "Pieces", Abbreviation = "pcs" };
        db.ProductCategories.Add(category);
        db.Units.Add(unit);

        var product = new Product
        {
            OrganizationId = org.Id, Sku = "SKU-1", Name = "Widget",
            CategoryId = category.Id, UnitId = unit.Id,
        };
        db.Products.Add(product);

        var warehouse = new Warehouse { OrganizationId = org.Id, Name = "Main" };
        db.Warehouses.Add(warehouse);

        return (org, product, warehouse);
    }

    [Fact]
    public async Task Receipt_IncreasesQuantityOnHand_AndRecordsMovement()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse) = SeedBasics(db);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var recorder = new StockMovementRecorder(db);
        await recorder.RecordAsync(org.Id, product.Id, warehouse.Id, StockMovementType.Receipt, 50,
            "PurchaseOrder", Guid.NewGuid(), null, default);
        await db.SaveChangesAsync();

        var item = db.InventoryItems.Single();
        item.QuantityOnHand.Should().Be(50);

        var movement = db.StockMovements.Single();
        movement.Quantity.Should().Be(50);
        movement.QuantityOnHandAfter.Should().Be(50);
    }

    [Fact]
    public async Task OutgoingMovement_ThatWouldGoNegative_Throws()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse) = SeedBasics(db);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var recorder = new StockMovementRecorder(db);

        // Only 10 in stock...
        await recorder.RecordAsync(org.Id, product.Id, warehouse.Id, StockMovementType.Receipt, 10,
            null, null, null, default);
        await db.SaveChangesAsync();

        // ...trying to sell 15 must be rejected, not silently clamp to zero.
        var act = () => recorder.RecordAsync(org.Id, product.Id, warehouse.Id, StockMovementType.Sale, 15,
            null, null, null, default);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*below zero*");

        // And the on-hand quantity must be unchanged by the rejected attempt.
        db.InventoryItems.Single().QuantityOnHand.Should().Be(10);
    }

    [Fact]
    public async Task SequentialMovements_KeepProjectionConsistentWithLedgerSum()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var (org, product, warehouse) = SeedBasics(db);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);

        var recorder = new StockMovementRecorder(db);

        await recorder.RecordAsync(org.Id, product.Id, warehouse.Id, StockMovementType.Receipt, 100, null, null, null, default);
        await db.SaveChangesAsync();
        await recorder.RecordAsync(org.Id, product.Id, warehouse.Id, StockMovementType.Sale, 30, null, null, null, default);
        await db.SaveChangesAsync();
        await recorder.RecordAsync(org.Id, product.Id, warehouse.Id, StockMovementType.AdjustmentOut, 5, null, null, null, default);
        await db.SaveChangesAsync();

        var expected = 100 - 30 - 5;
        db.InventoryItems.Single().QuantityOnHand.Should().Be(expected);

        // The projection must always equal the sum the ledger implies -
        // this is the whole point of never letting anything else touch QuantityOnHand.
        var ledgerSum = db.StockMovements.ToList()
            .Sum(m => m.MovementType is StockMovementType.Receipt or StockMovementType.AdjustmentIn
                ? m.Quantity : -m.Quantity);
        ledgerSum.Should().Be(expected);
    }
}
