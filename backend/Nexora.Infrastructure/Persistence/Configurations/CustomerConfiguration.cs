using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Sales;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");
        builder.Property(c => c.Name).HasMaxLength(256).IsRequired();
        builder.Property(c => c.CreditLimit).HasColumnType("numeric(18,2)");

        builder.HasIndex(c => new { c.OrganizationId, c.Name });

        builder.UseXminAsConcurrencyToken();
    }
}

public class CustomerAddressConfiguration : IEntityTypeConfiguration<CustomerAddress>
{
    public void Configure(EntityTypeBuilder<CustomerAddress> builder)
    {
        builder.ToTable("customer_addresses");
        builder.Property(a => a.Line1).HasMaxLength(256).IsRequired();
        builder.Property(a => a.City).HasMaxLength(128).IsRequired();
        builder.Property(a => a.Country).HasMaxLength(128).IsRequired();

        builder.HasOne(a => a.Customer).WithMany(c => c.Addresses)
            .HasForeignKey(a => a.CustomerId).OnDelete(DeleteBehavior.Cascade);

        builder.UseXminAsConcurrencyToken();
    }
}
