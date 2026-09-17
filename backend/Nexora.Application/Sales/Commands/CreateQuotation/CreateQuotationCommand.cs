using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sales;

namespace Nexora.Application.Sales.Commands.CreateQuotation;

public record QuotationItemInput(Guid ProductId, int Quantity, decimal UnitPrice);

public record CreateQuotationCommand(
    Guid CustomerId,
    DateOnly? ExpiryDate,
    string? Notes,
    IReadOnlyCollection<QuotationItemInput> Items) : IRequest<Guid>;

public class CreateQuotationCommandValidator : AbstractValidator<CreateQuotationCommand>
{
    public CreateQuotationCommandValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("A quotation must include at least one line item.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty();
            item.RuleFor(i => i.Quantity).GreaterThan(0);
            item.RuleFor(i => i.UnitPrice).GreaterThanOrEqualTo(0);
        });
    }
}

public class CreateQuotationCommandHandler : IRequestHandler<CreateQuotationCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateQuotationCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateQuotationCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var customerExists = await _db.Customers.AnyAsync(c => c.Id == request.CustomerId, cancellationToken);
        if (!customerExists)
            throw new InvalidOperationException("The selected customer does not exist.");

        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        if (products.Count != productIds.Count)
            throw new InvalidOperationException("One or more selected products do not exist.");

        var quotation = new Quotation
        {
            OrganizationId = organizationId,
            Number = $"QUO-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            CustomerId = request.CustomerId,
            ExpiryDate = request.ExpiryDate,
            Notes = request.Notes,
        };

        decimal subtotal = 0;
        foreach (var input in request.Items)
        {
            var lineTotal = input.Quantity * input.UnitPrice;
            subtotal += lineTotal;

            quotation.Items.Add(new QuotationItem
            {
                OrganizationId = organizationId,
                ProductId = input.ProductId,
                ProductNameSnapshot = products[input.ProductId].Name,
                Quantity = input.Quantity,
                UnitPrice = input.UnitPrice,
                LineTotal = lineTotal,
            });
        }

        quotation.Subtotal = subtotal;
        quotation.Total = subtotal; // no tax/discount engine yet - see spec section 20 "future: tax engine"

        _db.Quotations.Add(quotation);
        await _db.SaveChangesAsync(cancellationToken);

        return quotation.Id;
    }
}
