using Nexora.Domain.Common;

namespace Nexora.Domain.Sales;

public class Customer : TenantEntity
{
    public string Name { get; set; } = default!;
    public string? Email { get; set; }
    public string? Phone { get; set; }

    /// <summary>How many days after invoice date payment is due, when no explicit due date is set - e.g. "Net 30".</summary>
    public int DefaultPaymentTermDays { get; set; } = 30;

    /// <summary>Optional hard cap on total outstanding receivables before new sales orders warn/block - enforcement is a later phase.</summary>
    public decimal? CreditLimit { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
}

public class CustomerAddress : TenantEntity
{
    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public string Label { get; set; } = "Primary"; // "Billing", "Shipping", ...
    public string Line1 { get; set; } = default!;
    public string? Line2 { get; set; }
    public string City { get; set; } = default!;
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string Country { get; set; } = default!;
}
