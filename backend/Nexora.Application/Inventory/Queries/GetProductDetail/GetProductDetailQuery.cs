using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;

namespace Nexora.Application.Inventory.Queries.GetProductDetail;

public record GetProductDetailQuery(Guid ProductId) : IRequest<ProductDetailDto?>;

public record WarehouseStockDto(Guid WarehouseId, string WarehouseName, int QuantityOnHand, int QuantityReserved);

public record StockMovementDto(
    Guid Id, string MovementType, int Quantity, int QuantityOnHandAfter,
    string WarehouseName, string? ReferenceType, DateTimeOffset OccurredAt);

public record ProductDetailDto(
    Guid Id,
    string Sku,
    string Name,
    string? Description,
    string CategoryName,
    string UnitAbbreviation,
    decimal CostPrice,
    decimal SellingPrice,
    int ReorderLevel,
    int TotalOnHand,
    IReadOnlyCollection<WarehouseStockDto> StockByWarehouse,
    IReadOnlyCollection<StockMovementDto> RecentMovements);

public class GetProductDetailQueryHandler : IRequestHandler<GetProductDetailQuery, ProductDetailDto?>
{
    private readonly IApplicationDbContext _db;

    public GetProductDetailQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<ProductDetailDto?> Handle(GetProductDetailQuery request, CancellationToken cancellationToken)
    {
        var product = await _db.Products.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product is null) return null;

        var category = await _db.ProductCategories.AsNoTracking()
            .FirstAsync(c => c.Id == product.CategoryId, cancellationToken);
        var unit = await _db.Units.AsNoTracking()
            .FirstAsync(u => u.Id == product.UnitId, cancellationToken);

        var stockByWarehouse = await (
            from item in _db.InventoryItems.AsNoTracking()
            join warehouse in _db.Warehouses.AsNoTracking() on item.WarehouseId equals warehouse.Id
            where item.ProductId == request.ProductId
            select new WarehouseStockDto(warehouse.Id, warehouse.Name, item.QuantityOnHand, item.QuantityReserved)
        ).ToListAsync(cancellationToken);

        var recentMovements = await (
            from movement in _db.StockMovements.AsNoTracking()
            join warehouse in _db.Warehouses.AsNoTracking() on movement.WarehouseId equals warehouse.Id
            where movement.ProductId == request.ProductId
            orderby movement.OccurredAt descending
            select new StockMovementDto(
                movement.Id, movement.MovementType.ToString(), movement.Quantity,
                movement.QuantityOnHandAfter, warehouse.Name, movement.ReferenceType, movement.OccurredAt)
        ).Take(50).ToListAsync(cancellationToken);

        return new ProductDetailDto(
            product.Id, product.Sku, product.Name, product.Description,
            category.Name, unit.Abbreviation, product.CostPrice, product.SellingPrice,
            product.ReorderLevel, stockByWarehouse.Sum(s => s.QuantityOnHand),
            stockByWarehouse, recentMovements);
    }
}
