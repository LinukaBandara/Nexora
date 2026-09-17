using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sales;

namespace Nexora.Application.Finance.Queries.GetReceivablesAging;

public record GetReceivablesAgingQuery : IRequest<ReceivablesAgingDto>;

public record AgingLineDto(
    Guid InvoiceId, string InvoiceNumber, string CustomerName, DateOnly DueDate,
    decimal OriginalAmount, decimal PaidAmount, decimal OutstandingAmount, int DaysOverdue, string Bucket);

public record AgingBucketTotalsDto(decimal Current, decimal Days1To30, decimal Days31To60, decimal Days61To90, decimal Days90Plus);

public record ReceivablesAgingDto(AgingBucketTotalsDto Totals, IReadOnlyCollection<AgingLineDto> Lines);

public class GetReceivablesAgingQueryHandler : IRequestHandler<GetReceivablesAgingQuery, ReceivablesAgingDto>
{
    private readonly IApplicationDbContext _db;

    public GetReceivablesAgingQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<ReceivablesAgingDto> Handle(GetReceivablesAgingQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var openInvoices = await (
            from invoice in _db.Invoices.AsNoTracking()
            join customer in _db.Customers.AsNoTracking() on invoice.CustomerId equals customer.Id
            where invoice.Status != InvoiceStatus.Paid && invoice.Status != InvoiceStatus.Cancelled
            select new { invoice.Id, invoice.Number, CustomerName = customer.Name, invoice.DueDate, invoice.Total, invoice.AmountPaid }
        ).ToListAsync(cancellationToken);

        var lines = openInvoices.Select(i =>
        {
            var daysOverdue = Math.Max(0, today.DayNumber - i.DueDate.DayNumber);
            var bucket = AgingBuckets.Classify(daysOverdue);
            return new AgingLineDto(i.Id, i.Number, i.CustomerName, i.DueDate, i.Total, i.AmountPaid, i.Total - i.AmountPaid, daysOverdue, bucket);
        }).OrderByDescending(l => l.DaysOverdue).ToList();

        var totals = AgingBuckets.Sum(lines.Select(l => (l.Bucket, l.OutstandingAmount)));

        return new ReceivablesAgingDto(totals, lines);
    }
}

// Shared bucket logic - used identically by GetPayablesAgingQuery, so the
// definition of "31-60 days" can't drift between receivables and payables.
public static class AgingBuckets
{
    public static string Classify(int daysOverdue) => daysOverdue switch
    {
        <= 0 => "Current",
        <= 30 => "1-30",
        <= 60 => "31-60",
        <= 90 => "61-90",
        _ => "90+",
    };

    public static AgingBucketTotalsDto Sum(IEnumerable<(string Bucket, decimal Amount)> lines)
    {
        decimal current = 0, d1to30 = 0, d31to60 = 0, d61to90 = 0, d90plus = 0;
        foreach (var (bucket, amount) in lines)
        {
            switch (bucket)
            {
                case "Current": current += amount; break;
                case "1-30": d1to30 += amount; break;
                case "31-60": d31to60 += amount; break;
                case "61-90": d61to90 += amount; break;
                default: d90plus += amount; break;
            }
        }
        return new AgingBucketTotalsDto(current, d1to30, d31to60, d61to90, d90plus);
    }
}
