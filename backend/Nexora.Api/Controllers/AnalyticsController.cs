using MediatR;
using Microsoft.AspNetCore.Mvc;
using Nexora.Api.Authorization;
using Nexora.Application.Analytics.Queries.GetDashboardOverview;
using Nexora.Application.Analytics.Queries.GetInventoryAnalytics;
using Nexora.Application.Analytics.Queries.GetSalesAnalytics;
using Nexora.Application.Common.Security;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/v1/analytics")]
[HasPermission(Permissions.Analytics.View)]
public class AnalyticsController : ControllerBase
{
    private readonly ISender _mediator;

    public AnalyticsController(ISender mediator) => _mediator = mediator;

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDashboardOverviewQuery(from, to), ct);
        return Ok(result);
    }

    [HttpGet("sales")]
    public async Task<IActionResult> GetSalesAnalytics([FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetSalesAnalyticsQuery(from, to), ct);
        return Ok(result);
    }

    [HttpGet("inventory")]
    public async Task<IActionResult> GetInventoryAnalytics([FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetInventoryAnalyticsQuery(from, to), ct);
        return Ok(result);
    }
}
