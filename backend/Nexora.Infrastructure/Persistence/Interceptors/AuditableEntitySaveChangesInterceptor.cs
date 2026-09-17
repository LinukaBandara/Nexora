using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Audit;
using Nexora.Domain.Common;
using System.Text.Json;

namespace Nexora.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Runs on every SaveChanges call. Responsibilities, in order:
///   1. Stamps CreatedAt/By, UpdatedAt/By.
///   2. Converts hard deletes into soft deletes (sets DeletedAt instead of removing the row).
///   3. Writes one AuditLog row per meaningful insert/update/delete, with
///      before/after JSON snapshots - this is what powers the Audit Logs screen,
///      and it happens here so individual module handlers never have to
///      remember to log anything themselves.
/// Entities that opt out (lookup/reference tables) implement no marker and are skipped
/// by checking against a short exclusion list; everything else is audited by default.
/// </summary>
public class AuditableEntitySaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserService _currentUser;

    private static readonly HashSet<Type> ExcludedFromAudit = new()
    {
        typeof(AuditLog), // never audit the audit log itself
    };

    public AuditableEntitySaveChangesInterceptor(ICurrentUserService currentUser)
    {
        _currentUser = currentUser;
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
            ApplyAuditRules(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
            ApplyAuditRules(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void ApplyAuditRules(DbContext context)
    {
        var now = DateTimeOffset.UtcNow;
        var userId = _currentUser.UserId;
        var auditEntries = new List<AuditLog>();

        foreach (var entry in context.ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = userId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;

                case EntityState.Deleted:
                    // Convert every hard delete into a soft delete.
                    entry.State = EntityState.Modified;
                    entry.Entity.DeletedAt = now;
                    entry.Entity.DeletedBy = userId;
                    break;
            }

            if (ExcludedFromAudit.Contains(entry.Entity.GetType())) continue;
            if (entry.State is EntityState.Unchanged or EntityState.Detached) continue;

            var tenantId = entry.Entity is TenantEntity te ? te.OrganizationId : Guid.Empty;
            var branchId = entry.Entity is TenantEntity te2 ? te2.BranchId : null;

            auditEntries.Add(new AuditLog
            {
                OrganizationId = tenantId,
                BranchId = branchId,
                UserId = userId ?? Guid.Empty,
                UserName = _currentUser.Email ?? "system",
                Action = $"{entry.Entity.GetType().Name}{ActionSuffix(entry.State)}",
                EntityType = entry.Entity.GetType().Name,
                EntityId = entry.Entity.Id,
                BeforeState = entry.State == EntityState.Added ? null : SerializeOriginal(entry),
                AfterState = SerializeCurrent(entry),
                SourceNode = "cloud",
                OccurredAt = now,
            });
        }

        foreach (var log in auditEntries)
            context.Set<AuditLog>().Add(log);
    }

    private static string ActionSuffix(EntityState state) => state switch
    {
        EntityState.Added => "Created",
        EntityState.Modified => "Updated",
        _ => "Changed",
    };

    private static string SerializeCurrent(EntityEntry<BaseEntity> entry) =>
        JsonSerializer.Serialize(entry.CurrentValues.ToObject());

    private static string? SerializeOriginal(EntityEntry<BaseEntity> entry)
    {
        try
        {
            return JsonSerializer.Serialize(entry.OriginalValues.ToObject());
        }
        catch
        {
            return null;
        }
    }
}
