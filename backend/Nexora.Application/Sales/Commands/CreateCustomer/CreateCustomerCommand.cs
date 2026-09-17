using FluentValidation;
using MediatR;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sales;

namespace Nexora.Application.Sales.Commands.CreateCustomer;

public record CreateCustomerCommand(
    string Name, string? Email, string? Phone, int DefaultPaymentTermDays, decimal? CreditLimit) : IRequest<Guid>;

public class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(256);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.DefaultPaymentTermDays).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CreditLimit).GreaterThanOrEqualTo(0).When(x => x.CreditLimit.HasValue);
    }
}

public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateCustomerCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var customer = new Customer
        {
            OrganizationId = organizationId,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            DefaultPaymentTermDays = request.DefaultPaymentTermDays,
            CreditLimit = request.CreditLimit,
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync(cancellationToken);
        return customer.Id;
    }
}
