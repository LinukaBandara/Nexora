using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Inventory;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.ToTable("inventory");

        // Exactly one row per product+warehouse - StockMovementRecorder
        // depends on this to safely find-or-create.
        builder.HasIndex(i => new { i.ProductId, i.WarehouseId }).IsUnique();

        builder.HasOne(i => i.Product).WithMany().HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(i => i.Warehouse).WithMany().HasForeignKey(i => i.WarehouseId).OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(i => i.QuantityAvailable); // computed, not persisted

        builder.UseXminAsConcurrencyToken();
    }
}

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("stock_movements");

        builder.Property(m => m.MovementType).HasConversion<string>().HasMaxLength(32);
        builder.Property(m => m.ReferenceType).HasMaxLength(64);

        // Powers the "product history" and "recent activity" queries -
        // both read by product and by time, descending.
        builder.HasIndex(m => new { m.ProductId, m.OccurredAt });
        builder.HasIndex(m => new { m.OrganizationId, m.OccurredAt });
        builder.HasIndex(m => new { m.ReferenceType, m.ReferenceId });

        builder.HasOne(m => m.Product).WithMany().HasForeignKey(m => m.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.Warehouse).WithMany().HasForeignKey(m => m.WarehouseId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}
