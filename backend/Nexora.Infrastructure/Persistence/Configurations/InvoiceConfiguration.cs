using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Sales;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("invoices");
        builder.Property(i => i.Number).HasMaxLength(64).IsRequired();
        builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(i => i.Subtotal).HasColumnType("numeric(18,2)");
        builder.Property(i => i.Total).HasColumnType("numeric(18,2)");
        builder.Property(i => i.AmountPaid).HasColumnType("numeric(18,2)");

        builder.HasIndex(i => new { i.OrganizationId, i.Number }).IsUnique();
        // Powers the "unpaid/overdue invoices" dashboard and receivables queries.
        builder.HasIndex(i => new { i.OrganizationId, i.Status, i.DueDate });

        builder.Ignore(i => i.AmountDue); // computed, not persisted

        builder.HasOne(i => i.Customer).WithMany().HasForeignKey(i => i.CustomerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(i => i.SalesOrder).WithMany().HasForeignKey(i => i.SalesOrderId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}

public class InvoiceItemConfiguration : IEntityTypeConfiguration<InvoiceItem>
{
    public void Configure(EntityTypeBuilder<InvoiceItem> builder)
    {
        builder.ToTable("invoice_items");
        builder.Property(i => i.ProductNameSnapshot).HasMaxLength(256).IsRequired();
        builder.Property(i => i.UnitPrice).HasColumnType("numeric(18,2)");
        builder.Property(i => i.LineTotal).HasColumnType("numeric(18,2)");

        builder.HasOne(i => i.Invoice).WithMany(inv => inv.Items)
            .HasForeignKey(i => i.InvoiceId).OnDelete(DeleteBehavior.Cascade);

        builder.UseXminAsConcurrencyToken();
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("payments");
        builder.Property(p => p.Amount).HasColumnType("numeric(18,2)");
        builder.Property(p => p.Method).HasConversion<string>().HasMaxLength(32);
        builder.Property(p => p.Reference).HasMaxLength(128);

        builder.HasIndex(p => new { p.OrganizationId, p.ReceivedAt });

        builder.HasOne(p => p.Invoice).WithMany(i => i.Payments)
            .HasForeignKey(p => p.InvoiceId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}
