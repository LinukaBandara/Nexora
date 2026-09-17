using Nexora.Domain.Common;

namespace Nexora.Domain.Sales;

public enum SalesOrderStatus
{
    PendingApproval,
    Approved,
    PartiallyInvoiced,
    Invoiced,
    Cancelled,
}

public class SalesOrder : TenantEntity, ISyncableAggregate, IFinalizableDocument
{
    public string Number { get; set; } = default!;

    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public Guid? QuotationId { get; set; }
    public Guid WarehouseId { get; set; } // fulfillment warehouse - stock is deducted from here at invoicing

    public SalesOrderStatus Status { get; set; } = SalesOrderStatus.PendingApproval;
    public DateOnly OrderDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    public decimal Subtotal { get; set; }
    public decimal Total { get; set; }

    public string? Notes { get; set; }

    public Guid? ApprovedByUserId { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }

    public ICollection<SalesOrderItem> Items { get; set; } = new List<SalesOrderItem>();

    // ISyncableAggregate - sales orders are financial documents; conflicts
    // never auto-resolve when syncing (Phase 0 doc, section 8) - always
    // routed to sync_conflicts for a human decision.
    public Guid AggregateId => Id;
    public string AggregateType => nameof(SalesOrder);
    public int Version { get; set; } = 1;

    public bool IsTerminalStatus(object status) =>
        status is SalesOrderStatus s && (s == SalesOrderStatus.Invoiced || s == SalesOrderStatus.Cancelled);
}

public class SalesOrderItem : TenantEntity
{
    public Guid SalesOrderId { get; set; }
    public SalesOrder? SalesOrder { get; set; }

    public Guid ProductId { get; set; }
    public string ProductNameSnapshot { get; set; } = default!;

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }

    /// <summary>How much of this line has been invoiced so far - supports partial invoicing.</summary>
    public int QuantityInvoiced { get; set; }
}
