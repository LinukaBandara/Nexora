using Nexora.Domain.Common;

namespace Nexora.Domain.Sync;

public enum SyncOutboxStatus { Pending, Sent, Acknowledged, Failed }
public enum SyncEventType { Created, Updated }

/// <summary>
/// Written automatically by SyncOutboxInterceptor (Infrastructure) whenever
/// a SaveChanges call adds or modifies an entity implementing
/// ISyncableAggregate - never written by hand in a command handler. This is
/// what makes "every business-critical change is captured for sync" true
/// regardless of which module or command touched the entity.
/// </summary>
public class SyncOutboxEvent : TenantEntity
{
    public Guid AggregateId { get; set; }
    public string AggregateType { get; set; } = default!;
    public int Version { get; set; }
    public SyncEventType EventType { get; set; }

    /// <summary>JSON snapshot of the entity's current values at the moment of capture.</summary>
    public string Payload { get; set; } = default!;

    /// <summary>Stable per-event key so the receiving side can safely dedupe retries.</summary>
    public Guid IdempotencyKey { get; set; } = Guid.NewGuid();

    public SyncOutboxStatus Status { get; set; } = SyncOutboxStatus.Pending;
    public int AttemptCount { get; set; }
    public DateTimeOffset? LastAttemptAt { get; set; }
    public string? LastError { get; set; }
}

public enum SyncInboxStatus { Applied, Conflicted, Rejected }

/// <summary>
/// The receiving side's record of an event accepted from a node. The
/// IdempotencyKey unique index is what makes retried deliveries safe -
/// a duplicate delivery finds its existing row and returns the same
/// result rather than double-applying anything.
/// </summary>
public class SyncInboxEvent : TenantEntity
{
    public Guid SourceNodeId { get; set; }
    public Guid AggregateId { get; set; }
    public string AggregateType { get; set; } = default!;
    public int Version { get; set; }
    public SyncEventType EventType { get; set; }
    public string Payload { get; set; } = default!;
    public Guid IdempotencyKey { get; set; }

    public SyncInboxStatus Status { get; set; }
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum SyncConflictStatus { Open, ResolvedAcceptIncoming, ResolvedKeepExisting, ResolvedAuto }

/// <summary>
/// Written when ReceiveSyncEventsCommand detects a version mismatch for a
/// conflict-sensitive aggregate type. Never auto-resolved for financial
/// documents (SalesOrder, Invoice, Payment, PurchaseOrder) - see
/// docs/sync.md for the per-entity-type policy this implements.
/// </summary>
public class SyncConflict : TenantEntity
{
    public Guid AggregateId { get; set; }
    public string AggregateType { get; set; } = default!;

    public int ExistingVersion { get; set; }
    public string? ExistingPayload { get; set; }

    public int IncomingVersion { get; set; }
    public string IncomingPayload { get; set; } = default!;
    public Guid SourceNodeId { get; set; }

    public string Reason { get; set; } = default!;
    public SyncConflictStatus Status { get; set; } = SyncConflictStatus.Open;

    public Guid? ResolvedByUserId { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
}

/// <summary>
/// One row per (node, aggregate) pair - tracks the highest version this
/// receiver has accepted, which is what ReceiveSyncEventsCommand compares
/// an incoming event's version against to detect out-of-order or
/// conflicting updates.
/// </summary>
public class SyncCheckpoint : TenantEntity
{
    public Guid NodeId { get; set; }
    public Guid AggregateId { get; set; }
    public string AggregateType { get; set; } = default!;
    public int LastAppliedVersion { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// A local NEXORA node registered against this organization's cloud
/// tenant. NodeSecretHash authenticates the sync worker's calls -
/// deliberately separate from user JWTs, since a node isn't a person
/// (see Phase 0 doc section 8: "node credentials... independent of any
/// individual user's session").
/// </summary>
public class NodeRegistration : TenantEntity
{
    public string Name { get; set; } = default!;
    public string NodeSecretHash { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastHeartbeatAt { get; set; }
}
