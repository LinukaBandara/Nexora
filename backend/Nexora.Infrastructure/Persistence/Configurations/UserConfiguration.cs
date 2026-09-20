using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Identity;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
        builder.Property(u => u.FullName).HasMaxLength(256).IsRequired();
        builder.Property(u => u.PasswordHash).IsRequired();

        // Login accepts only email + password, so email must be globally unique.
        // Otherwise the cross-tenant IgnoreQueryFilters() lookup could resolve
        // the same email to an arbitrary organization.
        builder.HasIndex(u => u.Email).IsUnique();

        // Postgres optimistic concurrency via the built-in xmin system column -
        // same pattern applied to every entity, see ModelBuilderExtensions.
        builder.UseXminAsConcurrencyToken();

        builder.HasOne<Organization>()
            .WithMany()
            .HasForeignKey(u => u.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
