using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Inventory;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class ProductCategoryConfiguration : IEntityTypeConfiguration<ProductCategory>
{
    public void Configure(EntityTypeBuilder<ProductCategory> builder)
    {
        builder.ToTable("product_categories");
        builder.Property(c => c.Name).HasMaxLength(128).IsRequired();
        builder.UseXminAsConcurrencyToken();
    }
}

public class UnitConfiguration : IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.ToTable("units");
        builder.Property(u => u.Name).HasMaxLength(64).IsRequired();
        builder.Property(u => u.Abbreviation).HasMaxLength(16).IsRequired();
        builder.UseXminAsConcurrencyToken();
    }
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");
        builder.Property(p => p.Sku).HasMaxLength(64).IsRequired();
        builder.Property(p => p.Name).HasMaxLength(256).IsRequired();
        builder.Property(p => p.CostPrice).HasColumnType("numeric(18,2)");
        builder.Property(p => p.SellingPrice).HasColumnType("numeric(18,2)");

        // SKU unique per-organization, same reasoning as User.Email - see
        // UserConfiguration.
        builder.HasIndex(p => new { p.OrganizationId, p.Sku }).IsUnique();

        // Supports the Products list screen's search/filter and the
        // low-stock dashboard query.
        builder.HasIndex(p => new { p.OrganizationId, p.CategoryId });
        builder.HasIndex(p => new { p.OrganizationId, p.IsActive });

        builder.HasOne(p => p.Category).WithMany().HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Unit).WithMany().HasForeignKey(p => p.UnitId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}
