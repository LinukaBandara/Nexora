using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Identity;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("organizations");
        builder.Property(o => o.Name).HasMaxLength(256).IsRequired();
        builder.Property(o => o.Slug).HasMaxLength(256).IsRequired();
        builder.HasIndex(o => o.Slug).IsUnique();
        builder.UseXminAsConcurrencyToken();
    }
}

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("branches");
        builder.Property(b => b.Name).HasMaxLength(256).IsRequired();
        builder.UseXminAsConcurrencyToken();
    }
}

public class OrganizationSettingConfiguration : IEntityTypeConfiguration<OrganizationSetting>
{
    public void Configure(EntityTypeBuilder<OrganizationSetting> builder)
    {
        builder.ToTable("organization_settings");
        builder.Property(s => s.Key).HasMaxLength(128).IsRequired();
        builder.HasIndex(s => new { s.OrganizationId, s.Key }).IsUnique();
        builder.UseXminAsConcurrencyToken();
    }
}
