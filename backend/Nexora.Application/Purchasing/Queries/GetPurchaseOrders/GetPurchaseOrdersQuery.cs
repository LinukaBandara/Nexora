using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Models;
using Nexora.Domain.Purchasing;

namespace Nexora.Application.Purchasing.Queries.GetPurchaseOrders;

public record GetPurchaseOrdersQuery(PurchaseOrderStatus? Status, int Page = 1, int PageSize = 25)
    : IRequest<PagedResult<PurchaseOrderListItemDto>>;

public record PurchaseOrderListItemDto(
    Guid Id, string Number, string SupplierName, string Status, DateOnly OrderDate, decimal Total);

public class GetPurchaseOrdersQueryHandler : IRequestHandler<GetPurchaseOrdersQuery, PagedResult<PurchaseOrderListItemDto>>
{
    private readonly IApplicationDbContext _db;

    public GetPurchaseOrdersQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<PurchaseOrderListItemDto>> Handle(GetPurchaseOrdersQuery request, CancellationToken cancellationToken)
    {
        var query =
            from order in _db.PurchaseOrders.AsNoTracking()
            join supplier in _db.Suppliers.AsNoTracking() on order.SupplierId equals supplier.Id
            select new { order, supplier.Name };

        if (request.Status is not null)
            query = query.Where(x => x.order.Status == request.Status);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.order.OrderDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new PurchaseOrderListItemDto(
                x.order.Id, x.order.Number, x.Name, x.order.Status.ToString(), x.order.OrderDate, x.order.Total))
            .ToListAsync(cancellationToken);

        return new PagedResult<PurchaseOrderListItemDto>(items, totalCount, request.Page, request.PageSize);
    }
}
