using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Inventory;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("warehouses");
        builder.Property(w => w.Name).HasMaxLength(256).IsRequired();
        builder.UseXminAsConcurrencyToken();
    }
}

public class WarehouseLocationConfiguration : IEntityTypeConfiguration<WarehouseLocation>
{
    public void Configure(EntityTypeBuilder<WarehouseLocation> builder)
    {
        builder.ToTable("warehouse_locations");
        builder.Property(l => l.Name).HasMaxLength(128).IsRequired();

        builder.HasOne(l => l.Warehouse).WithMany(w => w.Locations)
            .HasForeignKey(l => l.WarehouseId).OnDelete(DeleteBehavior.Cascade);

        builder.UseXminAsConcurrencyToken();
    }
}
