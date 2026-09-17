using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Sales;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class QuotationConfiguration : IEntityTypeConfiguration<Quotation>
{
    public void Configure(EntityTypeBuilder<Quotation> builder)
    {
        builder.ToTable("quotations");
        builder.Property(q => q.Number).HasMaxLength(64).IsRequired();
        builder.Property(q => q.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(q => q.Subtotal).HasColumnType("numeric(18,2)");
        builder.Property(q => q.Total).HasColumnType("numeric(18,2)");

        builder.HasIndex(q => new { q.OrganizationId, q.Number }).IsUnique();

        builder.HasOne(q => q.Customer).WithMany().HasForeignKey(q => q.CustomerId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}

public class QuotationItemConfiguration : IEntityTypeConfiguration<QuotationItem>
{
    public void Configure(EntityTypeBuilder<QuotationItem> builder)
    {
        builder.ToTable("quotation_items");
        builder.Property(i => i.ProductNameSnapshot).HasMaxLength(256).IsRequired();
        builder.Property(i => i.UnitPrice).HasColumnType("numeric(18,2)");
        builder.Property(i => i.LineTotal).HasColumnType("numeric(18,2)");

        builder.HasOne(i => i.Quotation).WithMany(q => q.Items)
            .HasForeignKey(i => i.QuotationId).OnDelete(DeleteBehavior.Cascade);

        builder.UseXminAsConcurrencyToken();
    }
}
