using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Inventory;

namespace Nexora.Application.Inventory.Common;

/// <summary>
/// Every code path that changes stock - receiving, selling, adjusting,
/// transferring - goes through this, and only this. It is the one place
/// allowed to write InventoryItem.QuantityOnHand. This is what makes the
/// "sync movements, not final numbers" rule (Phase 0 doc, section 8)
/// actually true in code rather than just in the docs: there is no other
/// path by which QuantityOnHand can drift from the sum of its movements.
/// </summary>
public class StockMovementRecorder
{
    private readonly IApplicationDbContext _db;

    public StockMovementRecorder(IApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Records one movement and applies it to the InventoryItem projection
    /// in the same unit of work. Throws if an outgoing movement would drive
    /// on-hand stock negative - stock levels never go below zero, regardless
    /// of which code path is asking.
    /// </summary>
    public async Task<StockMovement> RecordAsync(
        Guid organizationId,
        Guid productId,
        Guid warehouseId,
        StockMovementType type,
        int quantity,
        string? referenceType,
        Guid? referenceId,
        string? notes,
        CancellationToken cancellationToken)
    {
        if (quantity <= 0)
            throw new InvalidOperationException("Movement quantity must be positive; direction is carried by MovementType.");

        var item = await _db.InventoryItems
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.WarehouseId == warehouseId, cancellationToken);

        if (item is null)
        {
            item = new InventoryItem
            {
                OrganizationId = organizationId,
                ProductId = productId,
                WarehouseId = warehouseId,
                QuantityOnHand = 0,
            };
            _db.InventoryItems.Add(item);
        }

        var isIncoming = type is StockMovementType.Receipt or StockMovementType.AdjustmentIn
            or StockMovementType.TransferIn or StockMovementType.SalesReturn;

        var newQuantityOnHand = isIncoming
            ? item.QuantityOnHand + quantity
            : item.QuantityOnHand - quantity;

        if (newQuantityOnHand < 0)
        {
            throw new InvalidOperationException(
                $"This movement would bring stock below zero (current: {item.QuantityOnHand}, requested: -{quantity}).");
        }

        item.QuantityOnHand = newQuantityOnHand;

        var movement = new StockMovement
        {
            OrganizationId = organizationId,
            ProductId = productId,
            WarehouseId = warehouseId,
            MovementType = type,
            Quantity = quantity,
            QuantityOnHandAfter = newQuantityOnHand,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            Notes = notes,
            OccurredAt = DateTimeOffset.UtcNow,
        };
        _db.StockMovements.Add(movement);

        return movement;
    }
}
