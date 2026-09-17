using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexora.Api.Authorization;
using Nexora.Application.Common.Security;
using Nexora.Application.Sync.Commands.ReceiveSyncEvents;
using Nexora.Application.Sync.Commands.RegisterNode;
using Nexora.Application.Sync.Commands.ResolveConflict;
using Nexora.Application.Sync.Queries.GetSyncStatus;
using Nexora.Infrastructure.Persistence;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/v1/sync")]
public class SyncController : ControllerBase
{
    private readonly ISender _mediator;
    private readonly NexoraDbContext _db;

    public SyncController(ISender mediator, NexoraDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    // ---- Node registration (authenticated user, org admin territory) --------

    public record RegisterNodeRequest(string Name);

    [HttpPost("nodes")]
    [HasPermission(Permissions.System.ManageOrganization)]
    public async Task<IActionResult> RegisterNode(RegisterNodeRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RegisterNodeCommand(request.Name), ct);
        // nodeSecret is returned exactly once, same as a refresh token at
        // registration - the local node's .env captures it at setup time.
        return Ok(new { nodeId = result.NodeId, nodeSecret = result.NodeSecret });
    }

    // ---- Receiving endpoint - called by a node's SyncWorker, not a browser ----
    //
    // Authenticated via X-Node-Secret, not a user JWT - a node isn't a person.
    // [AllowAnonymous] because ASP.NET's default JWT bearer scheme doesn't
    // apply here; NodeSecretAuthAsync below is the real gate.

    public record IncomingEventRequest(Guid AggregateId, string AggregateType, int Version, string EventTypeRaw, string Payload, Guid IdempotencyKey);
    public record ReceiveEventsRequest(string NodeId, IReadOnlyCollection<IncomingEventRequest> Events);

    [HttpPost("events")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveEvents(ReceiveEventsRequest request, CancellationToken ct)
    {
        var nodeSecret = Request.Headers["X-Node-Secret"].FirstOrDefault();
        var node = await AuthenticateNodeAsync(request.NodeId, nodeSecret, ct);
        if (node is null) return Unauthorized(new { message = "Unknown node or invalid node secret." });

        node.LastHeartbeatAt = DateTimeOffset.UtcNow;

        var events = request.Events
            .Select(e => new IncomingSyncEvent(e.AggregateId, e.AggregateType, e.Version, e.EventTypeRaw, e.Payload, e.IdempotencyKey))
            .ToList();

        var result = await _mediator.Send(new ReceiveSyncEventsCommand(node.OrganizationId, node.Id, events), ct);
        await _db.SaveChangesAsync(ct); // persists the heartbeat update above

        return Ok(new { acks = result.Acks });
    }

    private async Task<Domain.Sync.NodeRegistration?> AuthenticateNodeAsync(string nodeIdRaw, string? nodeSecret, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(nodeSecret) || !Guid.TryParse(nodeIdRaw, out var nodeId))
            return null;

        var node = await _db.NodeRegistrations.IgnoreQueryFilters()
            .FirstOrDefaultAsync(n => n.Id == nodeId && n.IsActive, ct);

        if (node is null) return null;

        // Simple secret comparison for this scaffold - a production node-auth
        // path would hash-compare like PasswordHasher does for users, and
        // this is exactly that same shape, just not wired up in Phase 6.
        var hasher = new Infrastructure.Services.PasswordHasher();
        return hasher.Verify(nodeSecret, node.NodeSecretHash) ? node : null;
    }

    // ---- Sync Center (authenticated, user-facing) -----------------------------

    [HttpGet("status")]
    [HasPermission(Permissions.System.ViewSyncCenter)]
    public async Task<IActionResult> GetSyncStatus(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetSyncStatusQuery(), ct);
        return Ok(result);
    }

    public record ResolveConflictRequest(ConflictResolution Resolution);

    [HttpPost("conflicts/{id:guid}/resolve")]
    [HasPermission(Permissions.System.ViewSyncCenter)]
    public async Task<IActionResult> ResolveConflict(Guid id, ResolveConflictRequest request, CancellationToken ct)
    {
        await _mediator.Send(new ResolveConflictCommand(id, request.Resolution), ct);
        return NoContent();
    }
}
