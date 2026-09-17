using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Inventory;

namespace Nexora.Application.Inventory.Commands.CreateProduct;

public record CreateProductCommand(
    string Sku,
    string Name,
    string? Description,
    Guid CategoryId,
    Guid UnitId,
    decimal CostPrice,
    decimal SellingPrice,
    int ReorderLevel) : IRequest<Guid>;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(256);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.UnitId).NotEmpty();
        RuleFor(x => x.CostPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.SellingPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ReorderLevel).GreaterThanOrEqualTo(0);
    }
}

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateProductCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var skuExists = await _db.Products.AnyAsync(p => p.Sku == request.Sku, cancellationToken);
        if (skuExists)
            throw new InvalidOperationException($"A product with SKU '{request.Sku}' already exists.");

        var categoryExists = await _db.ProductCategories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
            throw new InvalidOperationException("The selected category does not exist.");

        var unitExists = await _db.Units.AnyAsync(u => u.Id == request.UnitId, cancellationToken);
        if (!unitExists)
            throw new InvalidOperationException("The selected unit does not exist.");

        var product = new Product
        {
            OrganizationId = organizationId,
            Sku = request.Sku,
            Name = request.Name,
            Description = request.Description,
            CategoryId = request.CategoryId,
            UnitId = request.UnitId,
            CostPrice = request.CostPrice,
            SellingPrice = request.SellingPrice,
            ReorderLevel = request.ReorderLevel,
            Version = 1,
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync(cancellationToken);

        return product.Id;
    }
}
