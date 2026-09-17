using FluentValidation;
using MediatR;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Purchasing;

namespace Nexora.Application.Purchasing.Commands.CreateSupplier;

public record CreateSupplierCommand(string Name, string? Email, string? Phone, string? Address, int DefaultPaymentTermDays)
    : IRequest<Guid>;

public class CreateSupplierCommandValidator : AbstractValidator<CreateSupplierCommand>
{
    public CreateSupplierCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(256);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.DefaultPaymentTermDays).GreaterThanOrEqualTo(0);
    }
}

public class CreateSupplierCommandHandler : IRequestHandler<CreateSupplierCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateSupplierCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateSupplierCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var supplier = new Supplier
        {
            OrganizationId = organizationId,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            DefaultPaymentTermDays = request.DefaultPaymentTermDays,
        };

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync(cancellationToken);
        return supplier.Id;
    }
}
