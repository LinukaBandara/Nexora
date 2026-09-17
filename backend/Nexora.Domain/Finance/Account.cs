using Nexora.Domain.Common;

namespace Nexora.Domain.Finance;

public enum AccountType
{
    Asset,
    Liability,
    Equity,
    Income,
    Expense,
}

/// <summary>
/// A lightweight chart-of-accounts entry - enough to categorize income and
/// expenses (spec section 20's Phase 3/MVP finance core), not a full
/// double-entry ledger. "Future: double-entry accounting" (spec section 20)
/// is explicitly out of scope here; see docs/finance.md.
/// </summary>
public class Account : TenantEntity
{
    public string Name { get; set; } = default!;
    public AccountType Type { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Expense : TenantEntity
{
    public Guid AccountId { get; set; }
    public Account? Account { get; set; }

    public decimal Amount { get; set; }
    public string Description { get; set; } = default!;
    public DateOnly ExpenseDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    /// <summary>Optional link back to a SupplierInvoice payment, when this expense
    /// represents paying a supplier bill rather than a standalone cost (rent, utilities, ...).</summary>
    public Guid? SupplierInvoiceId { get; set; }
}

public class Income : TenantEntity
{
    public Guid AccountId { get; set; }
    public Account? Account { get; set; }

    public decimal Amount { get; set; }
    public string Description { get; set; } = default!;
    public DateOnly IncomeDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    /// <summary>Optional link to a Sales Payment, when this income record represents
    /// a customer payment rather than other business income.</summary>
    public Guid? SalesPaymentId { get; set; }
}
