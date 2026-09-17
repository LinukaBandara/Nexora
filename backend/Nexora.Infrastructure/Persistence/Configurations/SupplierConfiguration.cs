using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Purchasing;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.ToTable("suppliers");
        builder.Property(s => s.Name).HasMaxLength(256).IsRequired();

        builder.HasIndex(s => new { s.OrganizationId, s.Name });

        builder.UseXminAsConcurrencyToken();
    }
}
