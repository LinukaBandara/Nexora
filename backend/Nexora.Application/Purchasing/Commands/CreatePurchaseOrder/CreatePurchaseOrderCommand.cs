using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Purchasing;

namespace Nexora.Application.Purchasing.Commands.CreatePurchaseOrder;

public record PurchaseOrderItemInput(Guid ProductId, int Quantity, decimal UnitCost);

public record CreatePurchaseOrderCommand(
    Guid SupplierId,
    Guid WarehouseId,
    string? Notes,
    IReadOnlyCollection<PurchaseOrderItemInput> Items) : IRequest<Guid>;

public class CreatePurchaseOrderCommandValidator : AbstractValidator<CreatePurchaseOrderCommand>
{
    public CreatePurchaseOrderCommandValidator()
    {
        RuleFor(x => x.SupplierId).NotEmpty();
        RuleFor(x => x.WarehouseId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("A purchase order must include at least one line item.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty();
            item.RuleFor(i => i.Quantity).GreaterThan(0);
            item.RuleFor(i => i.UnitCost).GreaterThanOrEqualTo(0);
        });
    }
}

public class CreatePurchaseOrderCommandHandler : IRequestHandler<CreatePurchaseOrderCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreatePurchaseOrderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreatePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var supplierExists = await _db.Suppliers.AnyAsync(s => s.Id == request.SupplierId, cancellationToken);
        if (!supplierExists)
            throw new InvalidOperationException("The selected supplier does not exist.");

        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        if (products.Count != productIds.Count)
            throw new InvalidOperationException("One or more selected products do not exist.");

        var order = new PurchaseOrder
        {
            OrganizationId = organizationId,
            Number = $"PO-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            SupplierId = request.SupplierId,
            WarehouseId = request.WarehouseId,
            Notes = request.Notes,
        };

        decimal subtotal = 0;
        foreach (var input in request.Items)
        {
            var lineTotal = input.Quantity * input.UnitCost;
            subtotal += lineTotal;

            order.Items.Add(new PurchaseOrderItem
            {
                OrganizationId = organizationId,
                ProductId = input.ProductId,
                ProductNameSnapshot = products[input.ProductId].Name,
                Quantity = input.Quantity,
                UnitCost = input.UnitCost,
                LineTotal = lineTotal,
            });
        }

        order.Subtotal = subtotal;
        order.Total = subtotal;

        _db.PurchaseOrders.Add(order);
        await _db.SaveChangesAsync(cancellationToken);
        return order.Id;
    }
}
