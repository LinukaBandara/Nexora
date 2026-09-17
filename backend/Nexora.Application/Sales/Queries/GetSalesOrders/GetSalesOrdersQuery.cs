using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Models;
using Nexora.Domain.Sales;

namespace Nexora.Application.Sales.Queries.GetSalesOrders;

public record GetSalesOrdersQuery(SalesOrderStatus? Status, int Page = 1, int PageSize = 25)
    : IRequest<PagedResult<SalesOrderListItemDto>>;

public record SalesOrderListItemDto(
    Guid Id, string Number, string CustomerName, string Status, DateOnly OrderDate, decimal Total);

public class GetSalesOrdersQueryHandler : IRequestHandler<GetSalesOrdersQuery, PagedResult<SalesOrderListItemDto>>
{
    private readonly IApplicationDbContext _db;

    public GetSalesOrdersQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<SalesOrderListItemDto>> Handle(GetSalesOrdersQuery request, CancellationToken cancellationToken)
    {
        var query =
            from order in _db.SalesOrders.AsNoTracking()
            join customer in _db.Customers.AsNoTracking() on order.CustomerId equals customer.Id
            select new { order, customer.Name };

        if (request.Status is not null)
            query = query.Where(x => x.order.Status == request.Status);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.order.OrderDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new SalesOrderListItemDto(
                x.order.Id, x.order.Number, x.Name, x.order.Status.ToString(), x.order.OrderDate, x.order.Total))
            .ToListAsync(cancellationToken);

        return new PagedResult<SalesOrderListItemDto>(items, totalCount, request.Page, request.PageSize);
    }
}
