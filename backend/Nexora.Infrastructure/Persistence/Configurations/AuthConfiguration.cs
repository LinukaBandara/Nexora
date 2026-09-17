using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Audit;
using Nexora.Domain.Identity;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");
        builder.Property(rt => rt.TokenHash).IsRequired();
        builder.HasIndex(rt => rt.TokenHash).IsUnique();

        builder.HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.UseXminAsConcurrencyToken();
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.Property(a => a.Action).HasMaxLength(128).IsRequired();
        builder.Property(a => a.EntityType).HasMaxLength(128).IsRequired();

        // Query pattern for the Audit Logs screen: filter by org + entity, newest first.
        builder.HasIndex(a => new { a.OrganizationId, a.EntityType, a.EntityId });
        builder.HasIndex(a => new { a.OrganizationId, a.OccurredAt });

        builder.UseXminAsConcurrencyToken();
    }
}
