using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Purchasing;

namespace Nexora.Application.Purchasing.Commands.CreateSupplierInvoice;

public record CreateSupplierInvoiceCommand(
    Guid PurchaseOrderId, string SupplierInvoiceNumber, decimal Total, DateOnly? DueDate) : IRequest<Guid>;

public class CreateSupplierInvoiceCommandValidator : AbstractValidator<CreateSupplierInvoiceCommand>
{
    public CreateSupplierInvoiceCommandValidator()
    {
        RuleFor(x => x.PurchaseOrderId).NotEmpty();
        RuleFor(x => x.SupplierInvoiceNumber).NotEmpty().MaximumLength(128);
        RuleFor(x => x.Total).GreaterThan(0);
    }
}

public class CreateSupplierInvoiceCommandHandler : IRequestHandler<CreateSupplierInvoiceCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateSupplierInvoiceCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateSupplierInvoiceCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var order = await _db.PurchaseOrders.FirstOrDefaultAsync(o => o.Id == request.PurchaseOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Purchase order not found.");

        var supplier = await _db.Suppliers.FirstAsync(s => s.Id == order.SupplierId, cancellationToken);

        var invoice = new SupplierInvoice
        {
            OrganizationId = organizationId,
            Number = request.SupplierInvoiceNumber,
            PurchaseOrderId = order.Id,
            SupplierId = order.SupplierId,
            Total = request.Total,
            DueDate = request.DueDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(supplier.DefaultPaymentTermDays)),
        };

        _db.SupplierInvoices.Add(invoice);
        await _db.SaveChangesAsync(cancellationToken);
        return invoice.Id;
    }
}
