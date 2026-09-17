using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Sales;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class SalesOrderConfiguration : IEntityTypeConfiguration<SalesOrder>
{
    public void Configure(EntityTypeBuilder<SalesOrder> builder)
    {
        builder.ToTable("sales_orders");
        builder.Property(o => o.Number).HasMaxLength(64).IsRequired();
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(o => o.Subtotal).HasColumnType("numeric(18,2)");
        builder.Property(o => o.Total).HasColumnType("numeric(18,2)");

        builder.HasIndex(o => new { o.OrganizationId, o.Number }).IsUnique();
        builder.HasIndex(o => new { o.OrganizationId, o.Status });

        builder.HasOne(o => o.Customer).WithMany().HasForeignKey(o => o.CustomerId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}

public class SalesOrderItemConfiguration : IEntityTypeConfiguration<SalesOrderItem>
{
    public void Configure(EntityTypeBuilder<SalesOrderItem> builder)
    {
        builder.ToTable("sales_order_items");
        builder.Property(i => i.ProductNameSnapshot).HasMaxLength(256).IsRequired();
        builder.Property(i => i.UnitPrice).HasColumnType("numeric(18,2)");
        builder.Property(i => i.LineTotal).HasColumnType("numeric(18,2)");

        builder.HasOne(i => i.SalesOrder).WithMany(o => o.Items)
            .HasForeignKey(i => i.SalesOrderId).OnDelete(DeleteBehavior.Cascade);

        builder.UseXminAsConcurrencyToken();
    }
}
