using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Notifications;
using Nexora.Domain.Notifications;
using Nexora.Domain.Sync;

namespace Nexora.Application.Sync.Commands.ReceiveSyncEvents;

public record IncomingSyncEvent(
    Guid AggregateId, string AggregateType, int Version, string EventTypeRaw, string Payload, Guid IdempotencyKey);

public record ReceiveSyncEventsCommand(Guid OrganizationId, Guid NodeId, IReadOnlyCollection<IncomingSyncEvent> Events)
    : IRequest<ReceiveSyncEventsResult>;

public record EventAckDto(Guid IdempotencyKey, string Outcome);
public record ReceiveSyncEventsResult(IReadOnlyCollection<EventAckDto> Acks);

public class ReceiveSyncEventsCommandHandler : IRequestHandler<ReceiveSyncEventsCommand, ReceiveSyncEventsResult>
{
    private static readonly HashSet<string> AppendOnlyTypes = new() { "StockMovement" };

    private static readonly HashSet<string> NeverAutoResolveTypes = new()
    {
        "SalesOrder", "Invoice", "Payment", "PurchaseOrder",
    };

    private readonly IApplicationDbContext _db;
    private readonly INotificationService _notifications;

    public ReceiveSyncEventsCommandHandler(IApplicationDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<ReceiveSyncEventsResult> Handle(ReceiveSyncEventsCommand request, CancellationToken cancellationToken)
    {
        var acks = new List<EventAckDto>();

        foreach (var incoming in request.Events)
        {
            var ack = await ProcessOneAsync(request.OrganizationId, request.NodeId, incoming, cancellationToken);
            acks.Add(ack);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new ReceiveSyncEventsResult(acks);
    }

    private async Task<EventAckDto> ProcessOneAsync(
        Guid organizationId, Guid nodeId, IncomingSyncEvent incoming, CancellationToken cancellationToken)
    {
        var alreadyReceived = await _db.SyncInboxEvents.IgnoreQueryFilters()
            .AnyAsync(e => e.IdempotencyKey == incoming.IdempotencyKey, cancellationToken);

        if (alreadyReceived)
            return new EventAckDto(incoming.IdempotencyKey, "duplicate");

        var checkpoint = await _db.SyncCheckpoints.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.NodeId == nodeId
                && c.AggregateType == incoming.AggregateType
                && c.AggregateId == incoming.AggregateId, cancellationToken);

        var expectedNextVersion = (checkpoint?.LastAppliedVersion ?? 0) + 1;
        var isAppendOnly = AppendOnlyTypes.Contains(incoming.AggregateType);
        var versionMatches = isAppendOnly || incoming.Version == expectedNextVersion;

        var eventType = Enum.Parse<SyncEventType>(incoming.EventTypeRaw);
        var inboxStatus = SyncInboxStatus.Applied;
        var outcome = "applied";

        if (!versionMatches)
        {
            var neverAutoResolve = NeverAutoResolveTypes.Contains(incoming.AggregateType);

            _db.SyncConflicts.Add(new SyncConflict
            {
                OrganizationId = organizationId,
                AggregateId = incoming.AggregateId,
                AggregateType = incoming.AggregateType,
                ExistingVersion = checkpoint?.LastAppliedVersion ?? 0,
                IncomingVersion = incoming.Version,
                IncomingPayload = incoming.Payload,
                SourceNodeId = nodeId,
                Reason = neverAutoResolve
                    ? "Version mismatch on a financial/commercial document - requires manual review."
                    : "Version mismatch on master data - resolved last-write-wins, logged for visibility.",
                Status = neverAutoResolve ? SyncConflictStatus.Open : SyncConflictStatus.ResolvedAuto,
            });

            inboxStatus = SyncInboxStatus.Conflicted;
            outcome = "conflict";

            if (neverAutoResolve)
            {
                await _notifications.NotifyAsync(
                    organizationId, NotificationType.SyncConflict,
                    $"Sync conflict - {incoming.AggregateType}",
                    $"A {incoming.AggregateType} record couldn't be synced automatically and needs review.",
                    incoming.AggregateType, incoming.AggregateId, cancellationToken);

                _db.SyncInboxEvents.Add(BuildInboxEvent(organizationId, nodeId, incoming, eventType, inboxStatus));
                return new EventAckDto(incoming.IdempotencyKey, outcome);
            }
        }

        if (checkpoint is null)
        {
            checkpoint = new SyncCheckpoint
            {
                OrganizationId = organizationId,
                NodeId = nodeId,
                AggregateType = incoming.AggregateType,
                AggregateId = incoming.AggregateId,
            };
            _db.SyncCheckpoints.Add(checkpoint);
        }

        checkpoint.LastAppliedVersion = Math.Max(checkpoint.LastAppliedVersion, incoming.Version);
        checkpoint.UpdatedAt = DateTimeOffset.UtcNow;

        _db.SyncInboxEvents.Add(BuildInboxEvent(organizationId, nodeId, incoming, eventType, inboxStatus));

        return new EventAckDto(incoming.IdempotencyKey, outcome);
    }

    private static SyncInboxEvent BuildInboxEvent(
        Guid organizationId, Guid nodeId, IncomingSyncEvent incoming, SyncEventType eventType, SyncInboxStatus status) => new()
    {
        OrganizationId = organizationId,
        SourceNodeId = nodeId,
        AggregateId = incoming.AggregateId,
        AggregateType = incoming.AggregateType,
        Version = incoming.Version,
        EventType = eventType,
        Payload = incoming.Payload,
        IdempotencyKey = incoming.IdempotencyKey,
        Status = status,
    };
}
