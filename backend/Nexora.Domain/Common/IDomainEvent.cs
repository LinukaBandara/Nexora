using MediatR;

namespace Nexora.Domain.Common;

/// <summary>
/// Marker interface for domain events raised by entities. Dispatched via
/// MediatR notifications after SaveChanges succeeds (see
/// AuditableEntitySaveChangesInterceptor in Infrastructure). Handlers
/// subscribing to these events are how modules react to each other's
/// changes without directly depending on each other's repositories -
/// e.g. Audit and Sync both subscribe without Inventory/Sales knowing
/// they exist.
/// </summary>
public interface IDomainEvent : INotification
{
    Guid EventId { get; }
    DateTimeOffset OccurredAt { get; }
}

public abstract record DomainEventBase : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// Implemented by aggregate roots whose changes must be synchronized
/// to the cloud from a local node (or vice versa). The Sync module
/// writes one sync_outbox row per raised event for entities that
/// implement this - plain reference/lookup data does not.
/// </summary>
public interface ISyncableAggregate
{
    Guid AggregateId { get; }
    string AggregateType { get; }
    int Version { get; }
}
