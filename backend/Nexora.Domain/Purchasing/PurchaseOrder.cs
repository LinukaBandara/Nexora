using Nexora.Domain.Common;

namespace Nexora.Domain.Purchasing;

public enum PurchaseOrderStatus
{
    PendingApproval,
    Approved,
    PartiallyReceived,
    Received,
    Cancelled,
}

public class PurchaseOrder : TenantEntity, ISyncableAggregate, IFinalizableDocument
{
    public string Number { get; set; } = default!;

    public Guid SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    public Guid WarehouseId { get; set; } // goods received into this warehouse

    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.PendingApproval;
    public DateOnly OrderDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    public decimal Subtotal { get; set; }
    public decimal Total { get; set; }

    public string? Notes { get; set; }

    public Guid? ApprovedByUserId { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }

    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();

    // Financial/commercial document - never auto-resolved on sync conflict
    // (Phase 0 doc, section 8), same as SalesOrder.
    public Guid AggregateId => Id;
    public string AggregateType => nameof(PurchaseOrder);
    public int Version { get; set; } = 1;

    public bool IsTerminalStatus(object status) =>
        status is PurchaseOrderStatus s && (s == PurchaseOrderStatus.Received || s == PurchaseOrderStatus.Cancelled);
}

public class PurchaseOrderItem : TenantEntity
{
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }

    public Guid ProductId { get; set; }
    public string ProductNameSnapshot { get; set; } = default!;

    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal LineTotal { get; set; }

    /// <summary>How much of this line has been received so far - supports partial/split deliveries.</summary>
    public int QuantityReceived { get; set; }
}
