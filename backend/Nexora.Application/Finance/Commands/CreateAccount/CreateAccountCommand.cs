using FluentValidation;
using MediatR;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Finance;

namespace Nexora.Application.Finance.Commands.CreateAccount;

public record CreateAccountCommand(string Name, AccountType Type) : IRequest<Guid>;

public class CreateAccountCommandValidator : AbstractValidator<CreateAccountCommand>
{
    public CreateAccountCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(128);
    }
}

public class CreateAccountCommandHandler : IRequestHandler<CreateAccountCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateAccountCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateAccountCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var account = new Account
        {
            OrganizationId = organizationId,
            Name = request.Name,
            Type = request.Type,
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync(cancellationToken);
        return account.Id;
    }
}
