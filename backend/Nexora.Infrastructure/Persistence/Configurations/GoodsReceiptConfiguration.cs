using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Purchasing;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class GoodsReceiptConfiguration : IEntityTypeConfiguration<GoodsReceipt>
{
    public void Configure(EntityTypeBuilder<GoodsReceipt> builder)
    {
        builder.ToTable("goods_receipts");
        builder.Property(r => r.Number).HasMaxLength(64).IsRequired();

        builder.HasIndex(r => new { r.OrganizationId, r.Number }).IsUnique();

        builder.HasOne(r => r.PurchaseOrder).WithMany().HasForeignKey(r => r.PurchaseOrderId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}

public class GoodsReceiptItemConfiguration : IEntityTypeConfiguration<GoodsReceiptItem>
{
    public void Configure(EntityTypeBuilder<GoodsReceiptItem> builder)
    {
        builder.ToTable("goods_receipt_items");

        builder.HasOne(i => i.GoodsReceipt).WithMany(r => r.Items)
            .HasForeignKey(i => i.GoodsReceiptId).OnDelete(DeleteBehavior.Cascade);

        builder.UseXminAsConcurrencyToken();
    }
}

public class SupplierInvoiceConfiguration : IEntityTypeConfiguration<SupplierInvoice>
{
    public void Configure(EntityTypeBuilder<SupplierInvoice> builder)
    {
        builder.ToTable("supplier_invoices");
        builder.Property(i => i.Number).HasMaxLength(128).IsRequired();
        builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(i => i.Total).HasColumnType("numeric(18,2)");
        builder.Property(i => i.AmountPaid).HasColumnType("numeric(18,2)");

        builder.HasIndex(i => new { i.OrganizationId, i.Status, i.DueDate });
        builder.Ignore(i => i.AmountDue);

        builder.HasOne(i => i.PurchaseOrder).WithMany().HasForeignKey(i => i.PurchaseOrderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(i => i.Supplier).WithMany().HasForeignKey(i => i.SupplierId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}
