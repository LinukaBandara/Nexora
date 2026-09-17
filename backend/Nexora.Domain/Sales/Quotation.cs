using Nexora.Domain.Common;

namespace Nexora.Domain.Sales;

public enum QuotationStatus
{
    Draft,
    Sent,
    Accepted,
    Rejected,
    Expired,
    ConvertedToOrder,
}

public class Quotation : TenantEntity
{
    public string Number { get; set; } = default!;

    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public QuotationStatus Status { get; set; } = QuotationStatus.Draft;
    public DateOnly IssueDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly? ExpiryDate { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Total { get; set; } // Subtotal only for Phase 3 - tax/discount lines are a later refinement.

    public string? Notes { get; set; }

    public Guid? ConvertedToSalesOrderId { get; set; }

    public ICollection<QuotationItem> Items { get; set; } = new List<QuotationItem>();
}

public class QuotationItem : TenantEntity
{
    public Guid QuotationId { get; set; }
    public Quotation? Quotation { get; set; }

    public Guid ProductId { get; set; }

    /// <summary>Snapshotted at the time the line was added - if the product's name/price changes
    /// later, this quotation still shows what the customer was actually quoted.</summary>
    public string ProductNameSnapshot { get; set; } = default!;

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
