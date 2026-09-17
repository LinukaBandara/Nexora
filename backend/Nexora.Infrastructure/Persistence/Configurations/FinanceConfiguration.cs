using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Finance;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("accounts");
        builder.Property(a => a.Name).HasMaxLength(128).IsRequired();
        builder.Property(a => a.Type).HasConversion<string>().HasMaxLength(32);

        builder.UseXminAsConcurrencyToken();
    }
}

public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.ToTable("expenses");
        builder.Property(e => e.Amount).HasColumnType("numeric(18,2)");
        builder.Property(e => e.Description).HasMaxLength(512).IsRequired();

        builder.HasIndex(e => new { e.OrganizationId, e.ExpenseDate });

        builder.HasOne(e => e.Account).WithMany().HasForeignKey(e => e.AccountId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}

public class IncomeConfiguration : IEntityTypeConfiguration<Income>
{
    public void Configure(EntityTypeBuilder<Income> builder)
    {
        builder.ToTable("income");
        builder.Property(i => i.Amount).HasColumnType("numeric(18,2)");
        builder.Property(i => i.Description).HasMaxLength(512).IsRequired();

        builder.HasIndex(i => new { i.OrganizationId, i.IncomeDate });

        builder.HasOne(i => i.Account).WithMany().HasForeignKey(i => i.AccountId).OnDelete(DeleteBehavior.Restrict);

        builder.UseXminAsConcurrencyToken();
    }
}
