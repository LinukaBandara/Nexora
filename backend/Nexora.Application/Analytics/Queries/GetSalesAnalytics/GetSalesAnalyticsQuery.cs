using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sales;

namespace Nexora.Application.Analytics.Queries.GetSalesAnalytics;

public record GetSalesAnalyticsQuery(DateOnly From, DateOnly To) : IRequest<SalesAnalyticsDto>;

public record TopCustomerDto(string CustomerName, decimal TotalRevenue, int OrderCount);

public record SalesAnalyticsDto(
    decimal TotalRevenue,
    int TotalOrders,
    decimal AverageOrderValue,
    IReadOnlyCollection<TopCustomerDto> TopCustomers);

public class GetSalesAnalyticsQueryHandler : IRequestHandler<GetSalesAnalyticsQuery, SalesAnalyticsDto>
{
    private readonly IApplicationDbContext _db;

    public GetSalesAnalyticsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<SalesAnalyticsDto> Handle(GetSalesAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var ordersInRange = _db.SalesOrders.AsNoTracking()
            .Where(o => o.OrderDate >= request.From && o.OrderDate <= request.To
                && o.Status != SalesOrderStatus.Cancelled);

        var totalRevenue = await ordersInRange.SumAsync(o => (decimal?)o.Total, cancellationToken) ?? 0;
        var totalOrders = await ordersInRange.CountAsync(cancellationToken);
        var averageOrderValue = totalOrders == 0 ? 0 : totalRevenue / totalOrders;

        var topCustomers = await (
            from order in ordersInRange
            join customer in _db.Customers.AsNoTracking() on order.CustomerId equals customer.Id
            group order by customer.Name into g
            select new TopCustomerDto(g.Key, g.Sum(o => o.Total), g.Count())
        ).OrderByDescending(c => c.TotalRevenue).Take(5).ToListAsync(cancellationToken);

        return new SalesAnalyticsDto(totalRevenue, totalOrders, averageOrderValue, topCustomers);
    }
}
