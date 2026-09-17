using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sales;

namespace Nexora.Application.Sales.Commands.ConvertQuotationToSalesOrder;

public record ConvertQuotationToSalesOrderCommand(Guid QuotationId, Guid WarehouseId) : IRequest<Guid>;

public class ConvertQuotationToSalesOrderCommandValidator : AbstractValidator<ConvertQuotationToSalesOrderCommand>
{
    public ConvertQuotationToSalesOrderCommandValidator()
    {
        RuleFor(x => x.QuotationId).NotEmpty();
        RuleFor(x => x.WarehouseId).NotEmpty();
    }
}

public class ConvertQuotationToSalesOrderCommandHandler : IRequestHandler<ConvertQuotationToSalesOrderCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ConvertQuotationToSalesOrderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(ConvertQuotationToSalesOrderCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var quotation = await _db.Quotations
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.Id == request.QuotationId, cancellationToken)
            ?? throw new KeyNotFoundException("Quotation not found.");

        if (quotation.Status is QuotationStatus.ConvertedToOrder)
            throw new InvalidOperationException("This quotation has already been converted to a sales order.");

        if (quotation.Status is QuotationStatus.Rejected or QuotationStatus.Expired)
            throw new InvalidOperationException($"A {quotation.Status} quotation cannot be converted to a sales order.");

        var order = new SalesOrder
        {
            OrganizationId = organizationId,
            Number = $"SO-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            CustomerId = quotation.CustomerId,
            QuotationId = quotation.Id,
            WarehouseId = request.WarehouseId,
            Subtotal = quotation.Subtotal,
            Total = quotation.Total,
            Status = SalesOrderStatus.PendingApproval,
        };

        foreach (var item in quotation.Items)
        {
            order.Items.Add(new SalesOrderItem
            {
                OrganizationId = organizationId,
                ProductId = item.ProductId,
                ProductNameSnapshot = item.ProductNameSnapshot,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                LineTotal = item.LineTotal,
            });
        }

        _db.SalesOrders.Add(order);

        quotation.Status = QuotationStatus.ConvertedToOrder;
        quotation.ConvertedToSalesOrderId = order.Id;

        await _db.SaveChangesAsync(cancellationToken);
        return order.Id;
    }
}
