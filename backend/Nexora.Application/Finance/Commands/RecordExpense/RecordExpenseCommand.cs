using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Finance;

namespace Nexora.Application.Finance.Commands.RecordExpense;

public record RecordExpenseCommand(
    Guid AccountId, decimal Amount, string Description, DateOnly? ExpenseDate, Guid? SupplierInvoiceId) : IRequest<Guid>;

public class RecordExpenseCommandValidator : AbstractValidator<RecordExpenseCommand>
{
    public RecordExpenseCommandValidator()
    {
        RuleFor(x => x.AccountId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(512);
    }
}

public class RecordExpenseCommandHandler : IRequestHandler<RecordExpenseCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public RecordExpenseCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(RecordExpenseCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var accountExists = await _db.Accounts.AnyAsync(a => a.Id == request.AccountId, cancellationToken);
        if (!accountExists)
            throw new InvalidOperationException("The selected account does not exist.");

        var expense = new Expense
        {
            OrganizationId = organizationId,
            AccountId = request.AccountId,
            Amount = request.Amount,
            Description = request.Description,
            ExpenseDate = request.ExpenseDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            SupplierInvoiceId = request.SupplierInvoiceId,
        };

        _db.Expenses.Add(expense);

        // If this expense is settling a supplier invoice, update that
        // invoice's paid amount/status too - same "one place mutates the
        // balance" discipline as StockMovementRecorder for Inventory,
        // just without a dedicated recorder class since there's only one
        // caller today. Worth extracting if a second caller appears.
        if (request.SupplierInvoiceId is not null)
        {
            var supplierInvoice = await _db.SupplierInvoices
                .FirstOrDefaultAsync(i => i.Id == request.SupplierInvoiceId, cancellationToken);

            if (supplierInvoice is not null)
            {
                supplierInvoice.AmountPaid += request.Amount;
                supplierInvoice.Status = supplierInvoice.AmountPaid >= supplierInvoice.Total
                    ? Domain.Purchasing.SupplierInvoiceStatus.Paid
                    : Domain.Purchasing.SupplierInvoiceStatus.PartiallyPaid;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return expense.Id;
    }
}
