using MediatR;
using Microsoft.AspNetCore.Mvc;
using Nexora.Api.Authorization;
using Nexora.Application.Common.Security;
using Nexora.Application.Finance.Commands.CreateAccount;
using Nexora.Application.Finance.Commands.RecordExpense;
using Nexora.Application.Finance.Commands.RecordIncome;
using Nexora.Application.Finance.Queries.GetFinancialSummary;
using Nexora.Application.Finance.Queries.GetPayablesAging;
using Nexora.Application.Finance.Queries.GetReceivablesAging;
using Nexora.Application.Finance.Queries.GetTransactions;
using Nexora.Domain.Finance;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/v1/finance")]
public class FinanceController : ControllerBase
{
    private readonly ISender _mediator;

    public FinanceController(ISender mediator) => _mediator = mediator;

    // ---- Accounts ---------------------------------------------------------

    public record CreateAccountRequest(string Name, AccountType Type);

    [HttpPost("accounts")]
    [HasPermission(Permissions.Finance.Create)]
    public async Task<IActionResult> CreateAccount(CreateAccountRequest request, CancellationToken ct)
    {
        var id = await _mediator.Send(new CreateAccountCommand(request.Name, request.Type), ct);
        return Ok(new { id });
    }

    // ---- Expenses / Income -------------------------------------------------------

    public record RecordExpenseRequest(Guid AccountId, decimal Amount, string Description, DateOnly? ExpenseDate, Guid? SupplierInvoiceId);

    [HttpPost("expenses")]
    [HasPermission(Permissions.Finance.Create)]
    public async Task<IActionResult> RecordExpense(RecordExpenseRequest request, CancellationToken ct)
    {
        var id = await _mediator.Send(new RecordExpenseCommand(
            request.AccountId, request.Amount, request.Description, request.ExpenseDate, request.SupplierInvoiceId), ct);
        return Ok(new { id });
    }

    public record RecordIncomeRequest(Guid AccountId, decimal Amount, string Description, DateOnly? IncomeDate);

    [HttpPost("income")]
    [HasPermission(Permissions.Finance.Create)]
    public async Task<IActionResult> RecordIncome(RecordIncomeRequest request, CancellationToken ct)
    {
        var id = await _mediator.Send(new RecordIncomeCommand(
            request.AccountId, request.Amount, request.Description, request.IncomeDate), ct);
        return Ok(new { id });
    }

    // ---- Reporting -----------------------------------------------------------------

    [HttpGet("summary")]
    [HasPermission(Permissions.Finance.Read)]
    public async Task<IActionResult> GetFinancialSummary([FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetFinancialSummaryQuery(from, to), ct);
        return Ok(result);
    }

    [HttpGet("transactions")]
    [HasPermission(Permissions.Finance.Read)]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetTransactionsQuery(from, to, page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("receivables/aging")]
    [HasPermission(Permissions.Finance.Read)]
    public async Task<IActionResult> GetReceivablesAging(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetReceivablesAgingQuery(), ct);
        return Ok(result);
    }

    [HttpGet("payables/aging")]
    [HasPermission(Permissions.Finance.Read)]
    public async Task<IActionResult> GetPayablesAging(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPayablesAgingQuery(), ct);
        return Ok(result);
    }
}
