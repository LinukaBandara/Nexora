using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Purchasing;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class PurchaseOrderConfiguration : IEntityTypeConfiguration<PurchaseOrder>
{
    public void Configure(EntityTypeBuilder<PurchaseOrder> builder)
    {
        builder.ToTable("purchase_orders");
        builder.Property(o => o.Number).HasMaxLength(64).IsRequired();
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(o => o.Subtotal).HasColumnType("numeric(18,2)");
        builder.Property(o => o.Total).HasColumnType("numeric(18,2)");

        builder.HasIndex(o => new { o.OrganizationId, o.Number }).IsUnique();
        builder.HasIndex(o => new { o.OrganizationId, o.Status });

        builder.HasOne(o => o.Supplier).WithMany().HasForeignKey(o => o.SupplierId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}

public class PurchaseOrderItemConfiguration : IEntityTypeConfiguration<PurchaseOrderItem>
{
    public void Configure(EntityTypeBuilder<PurchaseOrderItem> builder)
    {
        builder.ToTable("purchase_order_items");
        builder.Property(i => i.ProductNameSnapshot).HasMaxLength(256).IsRequired();
        builder.Property(i => i.UnitCost).HasColumnType("numeric(18,2)");
        builder.Property(i => i.LineTotal).HasColumnType("numeric(18,2)");

        builder.HasOne(i => i.PurchaseOrder).WithMany(o => o.Items)
            .HasForeignKey(i => i.PurchaseOrderId).OnDelete(DeleteBehavior.Cascade);

        builder.UseXminAsConcurrencyToken();
    }
}
