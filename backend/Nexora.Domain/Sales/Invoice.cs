using Nexora.Domain.Common;

namespace Nexora.Domain.Sales;

public enum InvoiceStatus
{
    Unpaid,
    PartiallyPaid,
    Paid,
    Overdue,
    Cancelled,
}

public class Invoice : TenantEntity, ISyncableAggregate, IFinalizableDocument
{
    public string Number { get; set; } = default!;

    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public Guid SalesOrderId { get; set; }
    public SalesOrder? SalesOrder { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Unpaid;
    public DateOnly IssueDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly DueDate { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Total { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal AmountDue => Total - AmountPaid;

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();

    // Financial document - never auto-resolved on sync conflict, same as SalesOrder.
    public Guid AggregateId => Id;
    public string AggregateType => nameof(Invoice);
    public int Version { get; set; } = 1;

    public bool IsTerminalStatus(object status) =>
        status is InvoiceStatus s && (s == InvoiceStatus.Paid || s == InvoiceStatus.Cancelled);
}

public class InvoiceItem : TenantEntity
{
    public Guid InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }

    public Guid ProductId { get; set; }
    public string ProductNameSnapshot { get; set; } = default!;

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public enum PaymentMethod
{
    Cash,
    BankTransfer,
    Card,
    Cheque,
    Other,
}

public class Payment : TenantEntity, ISyncableAggregate
{
    public Guid InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }

    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Reference { get; set; } // cheque number, transaction id, etc.
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? Notes { get; set; }

    // Financial document - never auto-resolved on sync conflict.
    public Guid AggregateId => Id;
    public string AggregateType => nameof(Payment);
    public int Version { get; set; } = 1;
}
