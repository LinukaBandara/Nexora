using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Common;
using Nexora.Domain.Sync;
using System.Text.Json;

namespace Nexora.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Runs on every SaveChanges call, right alongside AuditableEntitySaveChangesInterceptor.
/// For every tracked entity implementing ISyncableAggregate that is Added or
/// Modified, this:
///   1. Bumps Version by 1 (Added entities start at whatever the caller set,
///      typically 1; Modified entities always increment).
///   2. Writes a SyncOutboxEvent with a JSON snapshot and a fresh idempotency key.
///
/// This is the entire reason ISyncableAggregate exists as a marker interface -
/// no command handler anywhere calls "write an outbox event" by hand. Entities
/// that don't implement it (lookup/reference data, audit logs, sync's own
/// tables) are never captured, since they're not meaningful to replicate to
/// a local node or the cloud.
/// </summary>
public class SyncOutboxInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
            CaptureOutboxEvents(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
            CaptureOutboxEvents(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void CaptureOutboxEvents(DbContext context)
    {
        var outboxEvents = new List<SyncOutboxEvent>();

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.Entity is not ISyncableAggregate syncable) continue;
            if (entry.State is not (EntityState.Added or EntityState.Modified)) continue;

            var isCreate = entry.State == EntityState.Added;

            if (!isCreate)
            {
                // Every accepted update bumps the version - this is what the
                // receiving side compares against to detect a conflicting
                // concurrent change (see ReceiveSyncEventsCommand).
                var versionProperty = entry.Property(nameof(ISyncableAggregate.Version));
                var currentVersion = (int)(versionProperty.CurrentValue ?? 1);
                versionProperty.CurrentValue = currentVersion + 1;
            }

            var organizationId = entry.Entity is TenantEntity tenantEntity ? tenantEntity.OrganizationId : Guid.Empty;

            outboxEvents.Add(new SyncOutboxEvent
            {
                OrganizationId = organizationId,
                AggregateId = syncable.AggregateId,
                AggregateType = syncable.AggregateType,
                Version = isCreate ? syncable.Version : (int)entry.Property(nameof(ISyncableAggregate.Version)).CurrentValue!,
                EventType = isCreate ? SyncEventType.Created : SyncEventType.Updated,
                Payload = JsonSerializer.Serialize(entry.CurrentValues.ToObject()),
            });
        }

        foreach (var outboxEvent in outboxEvents)
            context.Set<SyncOutboxEvent>().Add(outboxEvent);
    }
}
