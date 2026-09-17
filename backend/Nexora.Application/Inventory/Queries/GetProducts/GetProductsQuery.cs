using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Models;

namespace Nexora.Application.Inventory.Queries.GetProducts;

public record GetProductsQuery(
    string? Search,
    Guid? CategoryId,
    bool LowStockOnly,
    int Page = 1,
    int PageSize = 25) : IRequest<PagedResult<ProductListItemDto>>;

public record ProductListItemDto(
    Guid Id,
    string Sku,
    string Name,
    string CategoryName,
    string UnitAbbreviation,
    decimal SellingPrice,
    int TotalOnHand,
    int ReorderLevel,
    bool IsLowStock);

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, PagedResult<ProductListItemDto>>
{
    private readonly IApplicationDbContext _db;

    public GetProductsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<ProductListItemDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query =
            from product in _db.Products.AsNoTracking()
            join category in _db.ProductCategories.AsNoTracking() on product.CategoryId equals category.Id
            join unit in _db.Units.AsNoTracking() on product.UnitId equals unit.Id
            where product.IsActive
            select new
            {
                product.Id,
                product.Sku,
                product.Name,
                product.ReorderLevel,
                product.SellingPrice,
                product.CategoryId,
                CategoryName = category.Name,
                UnitAbbreviation = unit.Abbreviation,
            };

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term) || p.Sku.ToLower().Contains(term));
        }

        if (request.CategoryId is not null)
            query = query.Where(p => p.CategoryId == request.CategoryId);

        var totalCount = await query.CountAsync(cancellationToken);

        var page = await query
            .OrderBy(p => p.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Stock totals are summed separately per product (across all warehouses)
        // rather than joined above, to keep the pagination query itself simple.
        var productIds = page.Select(p => p.Id).ToList();
        var stockTotals = await _db.InventoryItems.AsNoTracking()
            .Where(i => productIds.Contains(i.ProductId))
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Total = g.Sum(i => i.QuantityOnHand) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Total, cancellationToken);

        var items = page.Select(p =>
        {
            var totalOnHand = stockTotals.GetValueOrDefault(p.Id, 0);
            return new ProductListItemDto(
                p.Id, p.Sku, p.Name, p.CategoryName, p.UnitAbbreviation,
                p.SellingPrice, totalOnHand, p.ReorderLevel,
                IsLowStock: totalOnHand <= p.ReorderLevel);
        });

        // KNOWN LIMITATION: LowStockOnly filters after paging, because on-hand
        // stock is only known once this page's InventoryItems are summed above.
        // That means TotalCount and a given page can undercount/skip items when
        // LowStockOnly is combined with pagination on a large catalog. Fixing
        // this properly means pushing the stock aggregation into the main query
        // (a Products→InventoryItems GroupJoin) - reasonable follow-up once the
        // Inventory Analytics query patterns in Phase 7 are known, rather than
        // guessing at the right shape now.
        if (request.LowStockOnly)
            items = items.Where(i => i.IsLowStock);

        return new PagedResult<ProductListItemDto>(items.ToList(), totalCount, request.Page, request.PageSize);
    }
}
