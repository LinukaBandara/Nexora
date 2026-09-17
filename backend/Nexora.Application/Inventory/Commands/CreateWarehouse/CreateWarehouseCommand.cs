using FluentValidation;
using MediatR;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Inventory;

namespace Nexora.Application.Inventory.Commands.CreateWarehouse;

public record CreateWarehouseCommand(string Name, string? Code, string? Address) : IRequest<Guid>;

public class CreateWarehouseCommandValidator : AbstractValidator<CreateWarehouseCommand>
{
    public CreateWarehouseCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(256);
    }
}

public class CreateWarehouseCommandHandler : IRequestHandler<CreateWarehouseCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateWarehouseCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var warehouse = new Warehouse
        {
            OrganizationId = organizationId,
            Name = request.Name,
            Code = request.Code,
            Address = request.Address,
        };
        _db.Warehouses.Add(warehouse);

        // Every warehouse gets a default location so simple businesses that
        // never subdivide storage don't have to think about locations at all.
        _db.WarehouseLocations.Add(new WarehouseLocation
        {
            OrganizationId = organizationId,
            WarehouseId = warehouse.Id,
            Name = "Main",
        });

        await _db.SaveChangesAsync(cancellationToken);
        return warehouse.Id;
    }
}
