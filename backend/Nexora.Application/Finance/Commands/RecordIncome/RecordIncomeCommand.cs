using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Finance;

namespace Nexora.Application.Finance.Commands.RecordIncome;

public record RecordIncomeCommand(Guid AccountId, decimal Amount, string Description, DateOnly? IncomeDate) : IRequest<Guid>;

public class RecordIncomeCommandValidator : AbstractValidator<RecordIncomeCommand>
{
    public RecordIncomeCommandValidator()
    {
        RuleFor(x => x.AccountId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(512);
    }
}

public class RecordIncomeCommandHandler : IRequestHandler<RecordIncomeCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public RecordIncomeCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(RecordIncomeCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var accountExists = await _db.Accounts.AnyAsync(a => a.Id == request.AccountId, cancellationToken);
        if (!accountExists)
            throw new InvalidOperationException("The selected account does not exist.");

        var income = new Income
        {
            OrganizationId = organizationId,
            AccountId = request.AccountId,
            Amount = request.Amount,
            Description = request.Description,
            IncomeDate = request.IncomeDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
        };

        _db.Incomes.Add(income);
        await _db.SaveChangesAsync(cancellationToken);
        return income.Id;
    }
}
