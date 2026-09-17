using Nexora.Domain.Common;

namespace Nexora.Domain.Inventory;

public enum StockAdjustmentReason
{
    StockCount,
    Damaged,
    Expired,
    Lost,
    Correction,
    Other,
}

/// <summary>
/// A single manual correction to one product's stock at one warehouse.
/// Always produces exactly one StockMovement (AdjustmentIn or
/// AdjustmentOut depending on the sign of Quantity) - the adjustment
/// record itself is the human-readable "why", the movement is the
/// ledger entry.
/// </summary>
public class StockAdjustment : TenantEntity
{
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    /// <summary>Positive = stock found/added, negative = stock removed/written off.</summary>
    public int QuantityDelta { get; set; }

    public StockAdjustmentReason Reason { get; set; }
    public string? Notes { get; set; }

    public Guid? ResultingMovementId { get; set; }
}

public enum StockTransferStatus
{
    Draft,
    InTransit,
    Completed,
    Cancelled,
}

/// <summary>
/// Moves stock from one warehouse to another. Completing a transfer
/// produces a TransferOut movement at the source and a TransferIn
/// movement at the destination, in the same database transaction -
/// stock is never "missing" between the two, even momentarily.
/// </summary>
public class StockTransfer : TenantEntity
{
    public string ReferenceNumber { get; set; } = default!;

    public Guid FromWarehouseId { get; set; }
    public Warehouse? FromWarehouse { get; set; }

    public Guid ToWarehouseId { get; set; }
    public Warehouse? ToWarehouse { get; set; }

    public StockTransferStatus Status { get; set; } = StockTransferStatus.Draft;
    public string? Notes { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public ICollection<StockTransferItem> Items { get; set; } = new List<StockTransferItem>();
}

public class StockTransferItem : TenantEntity
{
    public Guid StockTransferId { get; set; }
    public StockTransfer? StockTransfer { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public int Quantity { get; set; }
}
