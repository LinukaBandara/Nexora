using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sales;

namespace Nexora.Application.Analytics.Queries.GetDashboardOverview;

public record GetDashboardOverviewQuery(DateOnly From, DateOnly To) : IRequest<DashboardOverviewDto>;

public record DailyRevenuePointDto(DateOnly Date, decimal Revenue);
public record TopProductDto(string Name, int QuantitySold, decimal Revenue);
public record LowStockAlertDto(string ProductName, int TotalOnHand, int ReorderLevel);
public record RecentActivityDto(string Description, DateTimeOffset At);

public record DashboardOverviewDto(
    decimal Revenue,
    int OrderCount,
    decimal InventoryValue,
    decimal OutstandingReceivables,
    IReadOnlyCollection<DailyRevenuePointDto> RevenueTrend,
    IReadOnlyCollection<TopProductDto> TopProducts,
    IReadOnlyCollection<LowStockAlertDto> LowStockAlerts,
    IReadOnlyCollection<RecentActivityDto> RecentActivity);

/// <summary>
/// Deliberately reads from every module's own tables rather than a
/// separate reporting/materialized-view layer - correct at Phase 7's data
/// volumes, same "computed, not duplicated" reasoning as Finance's
/// receivables/payables (see docs/finance.md). Revisit with a proper
/// read-model/materialized view once real query load justifies it.
/// </summary>
public class GetDashboardOverviewQueryHandler : IRequestHandler<GetDashboardOverviewQuery, DashboardOverviewDto>
{
    private readonly IApplicationDbContext _db;

    public GetDashboardOverviewQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<DashboardOverviewDto> Handle(
        GetDashboardOverviewQuery request,
        CancellationToken cancellationToken)
    {
        var invoicesInRange = _db.Invoices.AsNoTracking()
            .Where(i =>
                i.IssueDate >= request.From &&
                i.IssueDate <= request.To &&
                i.Status != InvoiceStatus.Cancelled);

        var revenue = await invoicesInRange
            .SumAsync(i => (decimal?)i.Total, cancellationToken) ?? 0;

        var orderCount = await _db.SalesOrders
            .AsNoTracking()
            .CountAsync(
                o => o.OrderDate >= request.From &&
                     o.OrderDate <= request.To,
                cancellationToken);

        var inventoryValue = await (
            from item in _db.InventoryItems.AsNoTracking()
            join product in _db.Products.AsNoTracking()
                on item.ProductId equals product.Id
            select (decimal?)(item.QuantityOnHand * product.CostPrice)
        ).SumAsync(cancellationToken) ?? 0;

        var receivables = await _db.Invoices
            .AsNoTracking()
            .Where(i =>
                i.Status != InvoiceStatus.Paid &&
                i.Status != InvoiceStatus.Cancelled)
            .SumAsync(
                i => (decimal?)(i.Total - i.AmountPaid),
                cancellationToken) ?? 0;

        // Keep GROUP BY + SUM inside SQL. Project to an anonymous type first
        // because EF Core/SQL Server can translate this shape reliably,
        // whereas constructing the DailyRevenuePointDto record directly
        // inside the grouped query can fail translation.
        var revenueTrendRows = await invoicesInRange
            .GroupBy(i => i.IssueDate)
            .Select(g => new
            {
                Date = g.Key,
                Revenue = g.Sum(i => i.Total)
            })
            .OrderBy(p => p.Date)
            .ToListAsync(cancellationToken);

        var revenueTrend = revenueTrendRows
            .Select(p => new DailyRevenuePointDto(p.Date, p.Revenue))
            .ToList();

        var topProducts = await (
            from invoiceItem in _db.InvoiceItems.AsNoTracking()
            join invoice in invoicesInRange
                on invoiceItem.InvoiceId equals invoice.Id
            group invoiceItem by invoiceItem.ProductNameSnapshot into g
            select new TopProductDto(
                g.Key,
                g.Sum(x => x.Quantity),
                g.Sum(x => x.LineTotal))
        )
        .OrderByDescending(p => p.Revenue)
        .Take(5)
        .ToListAsync(cancellationToken);

        var lowStock = await (
            from product in _db.Products.AsNoTracking()
            where product.IsActive
            join item in _db.InventoryItems.AsNoTracking()
                on product.Id equals item.ProductId into items
            select new
            {
                product.Name,
                product.ReorderLevel,
                TotalOnHand = items.Sum(i => i.QuantityOnHand),
            }
        )
        .Where(p => p.TotalOnHand <= p.ReorderLevel)
        .OrderBy(p => p.TotalOnHand)
        .Take(10)
        .Select(p => new LowStockAlertDto(
            p.Name,
            p.TotalOnHand,
            p.ReorderLevel))
        .ToListAsync(cancellationToken);

        // Recent activity draws from AuditLog rather than re-querying every
        // module for "what changed recently" - audit logging already
        // captures this centrally (see docs/database.md).
        var recentActivity = await _db.AuditLogs
            .AsNoTracking()
            .OrderByDescending(a => a.OccurredAt)
            .Take(10)
            .Select(a => new RecentActivityDto(
                $"{a.Action} - {a.EntityType}",
                a.OccurredAt))
            .ToListAsync(cancellationToken);

        return new DashboardOverviewDto(
            revenue,
            orderCount,
            inventoryValue,
            receivables,
            revenueTrend,
            topProducts,
            lowStock,
            recentActivity);
    }
}