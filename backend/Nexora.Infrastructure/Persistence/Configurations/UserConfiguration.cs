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

        // Email is unique per-organization, not globally - two different
        // businesses can each have an "admin@theirbusiness.com" style
        // internal user without colliding. Login resolves the org from
        // the email at authentication time via IgnoreQueryFilters().
        builder.HasIndex(u => new { u.OrganizationId, u.Email }).IsUnique();

        // Postgres optimistic concurrency via the built-in xmin system column -
        // same pattern applied to every entity, see ModelBuilderExtensions.
        builder.UseXminAsConcurrencyToken();

        builder.HasOne<Organization>()
            .WithMany()
            .HasForeignKey(u => u.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
