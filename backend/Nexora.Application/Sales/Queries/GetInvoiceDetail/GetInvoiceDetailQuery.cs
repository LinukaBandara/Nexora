using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;

namespace Nexora.Application.Sales.Queries.GetInvoiceDetail;

public record GetInvoiceDetailQuery(Guid InvoiceId) : IRequest<InvoiceDetailDto?>;

public record InvoiceLineDto(string ProductName, int Quantity, decimal UnitPrice, decimal LineTotal);
public record PaymentDto(Guid Id, decimal Amount, string Method, string? Reference, DateTimeOffset ReceivedAt);

public record InvoiceDetailDto(
    Guid Id,
    string Number,
    string CustomerName,
    string Status,
    DateOnly IssueDate,
    DateOnly DueDate,
    decimal Subtotal,
    decimal Total,
    decimal AmountPaid,
    decimal AmountDue,
    IReadOnlyCollection<InvoiceLineDto> Items,
    IReadOnlyCollection<PaymentDto> Payments);

public class GetInvoiceDetailQueryHandler : IRequestHandler<GetInvoiceDetailQuery, InvoiceDetailDto?>
{
    private readonly IApplicationDbContext _db;

    public GetInvoiceDetailQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<InvoiceDetailDto?> Handle(GetInvoiceDetailQuery request, CancellationToken cancellationToken)
    {
        var invoice = await _db.Invoices.AsNoTracking()
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == request.InvoiceId, cancellationToken);

        if (invoice is null) return null;

        var customer = await _db.Customers.AsNoTracking()
            .FirstAsync(c => c.Id == invoice.CustomerId, cancellationToken);

        return new InvoiceDetailDto(
            invoice.Id, invoice.Number, customer.Name, invoice.Status.ToString(),
            invoice.IssueDate, invoice.DueDate, invoice.Subtotal, invoice.Total,
            invoice.AmountPaid, invoice.AmountDue,
            invoice.Items.Select(i => new InvoiceLineDto(i.ProductNameSnapshot, i.Quantity, i.UnitPrice, i.LineTotal)).ToList(),
            invoice.Payments.Select(p => new PaymentDto(p.Id, p.Amount, p.Method.ToString(), p.Reference, p.ReceivedAt)).ToList());
    }
}
