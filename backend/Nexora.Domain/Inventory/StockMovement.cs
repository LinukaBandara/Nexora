using Nexora.Domain.Common;

namespace Nexora.Domain.Inventory;

public enum StockMovementType
{
    Receipt,      // goods received from a purchase order
    Sale,         // sold out via an invoice
    AdjustmentIn,
    AdjustmentOut,
    TransferOut,
    TransferIn,
    SalesReturn,
}

/// <summary>
/// The denormalized "current stock level" for one product at one warehouse -
/// a read-optimized projection, not the source of truth. It exists so the
/// UI and low-stock alerts don't have to sum the entire movement history on
/// every read. It is only ever updated by replaying a StockMovement in the
/// same transaction that creates it (see StockMovementRecorder in
/// Application/Inventory/Common) - nothing sets QuantityOnHand directly.
/// This is also exactly why sync never transmits this row's final number
/// (see Phase 0 doc section 8): two nodes each replaying their own
/// movements against the same starting point converge safely, whereas
/// syncing two final numbers would silently overwrite one side's changes.
/// </summary>
public class InventoryItem : TenantEntity
{
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public int QuantityOnHand { get; set; }

    /// <summary>Reserved by unconfirmed sales orders - not yet subtracted from QuantityOnHand,
    /// but subtracted when computing what's actually available to sell.</summary>
    public int QuantityReserved { get; set; }

    public int QuantityAvailable => QuantityOnHand - QuantityReserved;
}

/// <summary>
/// Append-only. Every stock-level change in the system - receiving,
/// selling, adjusting, transferring - is recorded here first; InventoryItem
/// is then updated to match. Never edited or deleted after creation.
/// </summary>
public class StockMovement : TenantEntity, ISyncableAggregate
{
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public StockMovementType MovementType { get; set; }

    /// <summary>Always positive - direction is carried by MovementType, not the sign.</summary>
    public int Quantity { get; set; }

    public int QuantityOnHandAfter { get; set; }

    /// <summary>e.g. "PurchaseOrder", "SalesOrder", "StockAdjustment", "StockTransfer"</summary>
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }

    public string? Notes { get; set; }
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;

    // ISyncableAggregate - movements are replayed, never overwritten, when
    // syncing between a local node and the cloud (see Phase 0 doc section 8).
    public Guid AggregateId => Id;
    public string AggregateType => nameof(StockMovement);
    public int Version { get; set; } = 1; // movements are immutable, so this never advances past 1
}
