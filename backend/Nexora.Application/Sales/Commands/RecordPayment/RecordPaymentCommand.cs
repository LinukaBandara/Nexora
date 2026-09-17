using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Notifications;
using Nexora.Domain.Notifications;
using Nexora.Domain.Sales;

namespace Nexora.Application.Sales.Commands.RecordPayment;

public record RecordPaymentCommand(
    Guid InvoiceId, decimal Amount, PaymentMethod Method, string? Reference, string? Notes) : IRequest<Guid>;

public class RecordPaymentCommandValidator : AbstractValidator<RecordPaymentCommand>
{
    public RecordPaymentCommandValidator()
    {
        RuleFor(x => x.InvoiceId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
    }
}

public class RecordPaymentCommandHandler : IRequestHandler<RecordPaymentCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;

    public RecordPaymentCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, INotificationService notifications)
    {
        _db = db;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    public async Task<Guid> Handle(RecordPaymentCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.Id == request.InvoiceId, cancellationToken)
            ?? throw new KeyNotFoundException("Invoice not found.");

        if (invoice.Status is InvoiceStatus.Cancelled)
            throw new InvalidOperationException("Cannot record a payment against a cancelled invoice.");

        if (request.Amount > invoice.AmountDue)
            throw new InvalidOperationException(
                $"Payment of {request.Amount:0.00} exceeds the amount due ({invoice.AmountDue:0.00}). " +
                "Overpayments/credit notes are not supported in this phase.");

        var payment = new Payment
        {
            OrganizationId = organizationId,
            InvoiceId = invoice.Id,
            Amount = request.Amount,
            Method = request.Method,
            Reference = request.Reference,
            Notes = request.Notes,
        };
        _db.Payments.Add(payment);

        invoice.AmountPaid += request.Amount;
        invoice.Status = invoice.AmountPaid >= invoice.Total ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;

        await _notifications.NotifyAsync(
            organizationId, NotificationType.PaymentReceived,
            $"Payment received - {invoice.Number}",
            $"{request.Amount:0.00} received against invoice {invoice.Number}.",
            nameof(Invoice), invoice.Id, cancellationToken);

        await _db.SaveChangesAsync(cancellationToken);
        return payment.Id;
    }
}
