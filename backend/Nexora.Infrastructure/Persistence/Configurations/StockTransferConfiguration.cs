using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Inventory;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class StockAdjustmentConfiguration : IEntityTypeConfiguration<StockAdjustment>
{
    public void Configure(EntityTypeBuilder<StockAdjustment> builder)
    {
        builder.ToTable("stock_adjustments");
        builder.Property(a => a.Reason).HasConversion<string>().HasMaxLength(32);

        builder.HasOne(a => a.Product).WithMany().HasForeignKey(a => a.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(a => a.Warehouse).WithMany().HasForeignKey(a => a.WarehouseId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}

public class StockTransferConfiguration : IEntityTypeConfiguration<StockTransfer>
{
    public void Configure(EntityTypeBuilder<StockTransfer> builder)
    {
        builder.ToTable("stock_transfers");
        builder.Property(t => t.ReferenceNumber).HasMaxLength(64).IsRequired();
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(32);

        builder.HasIndex(t => new { t.OrganizationId, t.ReferenceNumber }).IsUnique();

        builder.HasOne(t => t.FromWarehouse).WithMany().HasForeignKey(t => t.FromWarehouseId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(t => t.ToWarehouse).WithMany().HasForeignKey(t => t.ToWarehouseId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}

public class StockTransferItemConfiguration : IEntityTypeConfiguration<StockTransferItem>
{
    public void Configure(EntityTypeBuilder<StockTransferItem> builder)
    {
        builder.ToTable("stock_transfer_items");

        builder.HasOne(i => i.StockTransfer).WithMany(t => t.Items)
            .HasForeignKey(i => i.StockTransferId).OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Product).WithMany().HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}
