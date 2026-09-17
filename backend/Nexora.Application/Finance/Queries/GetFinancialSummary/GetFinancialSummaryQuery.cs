using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Purchasing;
using Nexora.Domain.Sales;

namespace Nexora.Application.Finance.Queries.GetFinancialSummary;

public record GetFinancialSummaryQuery(DateOnly From, DateOnly To) : IRequest<FinancialSummaryDto>;

public record FinancialSummaryDto(
    decimal Income,
    decimal Expenses,
    decimal NetCashFlow,
    decimal Receivables,
    decimal Payables);

/// <summary>
/// Deliberately reads Income/Expenses from Finance's own tables plus
/// Receivables/Payables computed live from Sales.Invoice and
/// Purchasing.SupplierInvoice, rather than maintaining separate
/// receivables/payables ledger tables that could drift out of sync with
/// the invoices they're supposed to summarize. See docs/finance.md for
/// why this deviates from the Phase 0 schema's separate receivables/
/// payables tables.
/// </summary>
public class GetFinancialSummaryQueryHandler : IRequestHandler<GetFinancialSummaryQuery, FinancialSummaryDto>
{
    private readonly IApplicationDbContext _db;

    public GetFinancialSummaryQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<FinancialSummaryDto> Handle(GetFinancialSummaryQuery request, CancellationToken cancellationToken)
    {
        var standaloneIncome = await _db.Incomes.AsNoTracking()
            .Where(i => i.IncomeDate >= request.From && i.IncomeDate <= request.To)
            .SumAsync(i => (decimal?)i.Amount, cancellationToken) ?? 0;

        // Sales payments are income too, even though they live on the Sales
        // side of the codebase - counted here by date received rather than
        // duplicated into a Finance-owned Income row per payment.
        var salesPaymentIncome = await _db.Payments.AsNoTracking()
            .Where(p => DateOnly.FromDateTime(p.ReceivedAt.UtcDateTime) >= request.From
                     && DateOnly.FromDateTime(p.ReceivedAt.UtcDateTime) <= request.To)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0;

        var expenses = await _db.Expenses.AsNoTracking()
            .Where(e => e.ExpenseDate >= request.From && e.ExpenseDate <= request.To)
            .SumAsync(e => (decimal?)e.Amount, cancellationToken) ?? 0;

        var receivables = await _db.Invoices.AsNoTracking()
            .Where(i => i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled)
            .SumAsync(i => (decimal?)(i.Total - i.AmountPaid), cancellationToken) ?? 0;

        var payables = await _db.SupplierInvoices.AsNoTracking()
            .Where(i => i.Status != SupplierInvoiceStatus.Paid)
            .SumAsync(i => (decimal?)(i.Total - i.AmountPaid), cancellationToken) ?? 0;

        var totalIncome = standaloneIncome + salesPaymentIncome;

        return new FinancialSummaryDto(
            totalIncome, expenses, totalIncome - expenses, receivables, payables);
    }
}
