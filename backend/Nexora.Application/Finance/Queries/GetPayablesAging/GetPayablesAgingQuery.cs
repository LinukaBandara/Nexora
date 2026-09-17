using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Finance.Queries.GetReceivablesAging;
using Nexora.Domain.Purchasing;

namespace Nexora.Application.Finance.Queries.GetPayablesAging;

public record GetPayablesAgingQuery : IRequest<PayablesAgingDto>;

public record PayablesAgingLineDto(
    Guid SupplierInvoiceId, string InvoiceNumber, string SupplierName, DateOnly DueDate,
    decimal OriginalAmount, decimal PaidAmount, decimal OutstandingAmount, int DaysOverdue, string Bucket);

public record PayablesAgingDto(AgingBucketTotalsDto Totals, IReadOnlyCollection<PayablesAgingLineDto> Lines);

public class GetPayablesAgingQueryHandler : IRequestHandler<GetPayablesAgingQuery, PayablesAgingDto>
{
    private readonly IApplicationDbContext _db;

    public GetPayablesAgingQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PayablesAgingDto> Handle(GetPayablesAgingQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var openInvoices = await (
            from invoice in _db.SupplierInvoices.AsNoTracking()
            join supplier in _db.Suppliers.AsNoTracking() on invoice.SupplierId equals supplier.Id
            where invoice.Status != SupplierInvoiceStatus.Paid
            select new { invoice.Id, invoice.Number, SupplierName = supplier.Name, invoice.DueDate, invoice.Total, invoice.AmountPaid }
        ).ToListAsync(cancellationToken);

        var lines = openInvoices.Select(i =>
        {
            var daysOverdue = Math.Max(0, today.DayNumber - i.DueDate.DayNumber);
            var bucket = AgingBuckets.Classify(daysOverdue);
            return new PayablesAgingLineDto(i.Id, i.Number, i.SupplierName, i.DueDate, i.Total, i.AmountPaid, i.Total - i.AmountPaid, daysOverdue, bucket);
        }).OrderByDescending(l => l.DaysOverdue).ToList();

        var totals = AgingBuckets.Sum(lines.Select(l => (l.Bucket, l.OutstandingAmount)));

        return new PayablesAgingDto(totals, lines);
    }
}
