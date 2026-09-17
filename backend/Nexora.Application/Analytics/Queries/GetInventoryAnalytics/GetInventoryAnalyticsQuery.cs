using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Inventory;

namespace Nexora.Application.Analytics.Queries.GetInventoryAnalytics;

public record GetInventoryAnalyticsQuery(DateOnly From, DateOnly To) : IRequest<InventoryAnalyticsDto>;

public record DailyMovementPointDto(DateOnly Date, int UnitsIn, int UnitsOut);
public record WarehouseValueDto(string WarehouseName, decimal StockValue);

public record InventoryAnalyticsDto(
    decimal TotalStockValue,
    int ProductCount,
    int LowStockCount,
    int OutOfStockCount,
    IReadOnlyCollection<DailyMovementPointDto> MovementTrend,
    IReadOnlyCollection<WarehouseValueDto> ValueByWarehouse);

public class GetInventoryAnalyticsQueryHandler : IRequestHandler<GetInventoryAnalyticsQuery, InventoryAnalyticsDto>
{
    private static readonly StockMovementType[] IncomingTypes =
    {
        StockMovementType.Receipt, StockMovementType.AdjustmentIn,
        StockMovementType.TransferIn, StockMovementType.SalesReturn,
    };

    private readonly IApplicationDbContext _db;

    public GetInventoryAnalyticsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<InventoryAnalyticsDto> Handle(GetInventoryAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var stockRows = await (
            from item in _db.InventoryItems.AsNoTracking()
            join product in _db.Products.AsNoTracking() on item.ProductId equals product.Id
            where product.IsActive
            select new { item.QuantityOnHand, product.CostPrice, product.ReorderLevel }
        ).ToListAsync(cancellationToken);

        var totalStockValue = stockRows.Sum(r => r.QuantityOnHand * r.CostPrice);
        var lowStockCount = stockRows.Count(r => r.QuantityOnHand > 0 && r.QuantityOnHand <= r.ReorderLevel);
        var outOfStockCount = stockRows.Count(r => r.QuantityOnHand <= 0);

        var productCount = await _db.Products.AsNoTracking().CountAsync(p => p.IsActive, cancellationToken);

        var movements = await _db.StockMovements.AsNoTracking()
            .Where(m => DateOnly.FromDateTime(m.OccurredAt.UtcDateTime) >= request.From
                     && DateOnly.FromDateTime(m.OccurredAt.UtcDateTime) <= request.To)
            .ToListAsync(cancellationToken);

        var movementTrend = movements
            .GroupBy(m => DateOnly.FromDateTime(m.OccurredAt.UtcDateTime))
            .Select(g => new DailyMovementPointDto(
                g.Key,
                g.Where(m => IncomingTypes.Contains(m.MovementType)).Sum(m => m.Quantity),
                g.Where(m => !IncomingTypes.Contains(m.MovementType)).Sum(m => m.Quantity)))
            .OrderBy(p => p.Date)
            .ToList();

        var valueByWarehouse = await (
            from item in _db.InventoryItems.AsNoTracking()
            join product in _db.Products.AsNoTracking() on item.ProductId equals product.Id
            join warehouse in _db.Warehouses.AsNoTracking() on item.WarehouseId equals warehouse.Id
            group item.QuantityOnHand * product.CostPrice by warehouse.Name into g
            select new WarehouseValueDto(g.Key, g.Sum())
        ).ToListAsync(cancellationToken);

        return new InventoryAnalyticsDto(
            totalStockValue, productCount, lowStockCount, outOfStockCount, movementTrend, valueByWarehouse);
    }
}
