using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Models;

namespace Nexora.Application.Finance.Queries.GetTransactions;

public record GetTransactionsQuery(DateOnly? From, DateOnly? To, int Page = 1, int PageSize = 25)
    : IRequest<PagedResult<TransactionDto>>;

public record TransactionDto(Guid Id, DateOnly Date, string Description, string AccountName, string Type, decimal Amount);

public class GetTransactionsQueryHandler : IRequestHandler<GetTransactionsQuery, PagedResult<TransactionDto>>
{
    private readonly IApplicationDbContext _db;

    public GetTransactionsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<TransactionDto>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        var expenses =
            from expense in _db.Expenses.AsNoTracking()
            join account in _db.Accounts.AsNoTracking() on expense.AccountId equals account.Id
            select new TransactionDto(expense.Id, expense.ExpenseDate, expense.Description, account.Name, "Expense", -expense.Amount);

        var incomes =
            from income in _db.Incomes.AsNoTracking()
            join account in _db.Accounts.AsNoTracking() on income.AccountId equals account.Id
            select new TransactionDto(income.Id, income.IncomeDate, income.Description, account.Name, "Income", income.Amount);

        var combined = expenses.Concat(incomes);

        if (request.From is not null)
            combined = combined.Where(t => t.Date >= request.From);
        if (request.To is not null)
            combined = combined.Where(t => t.Date <= request.To);

        // EF Core cannot translate Concat().OrderBy() against two different
        // queryables reliably in every provider, so materialize before the
        // final sort/paginate - acceptable at Phase 5's data volumes, but
        // worth revisiting (e.g. a UNION-backed view) if transaction counts
        // grow into the hundreds of thousands.
        var all = await combined.ToListAsync(cancellationToken);
        var totalCount = all.Count;

        var page = all
            .OrderByDescending(t => t.Date)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        return new PagedResult<TransactionDto>(page, totalCount, request.Page, request.PageSize);
    }
}
