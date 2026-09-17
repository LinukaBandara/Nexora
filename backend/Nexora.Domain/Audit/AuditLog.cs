using Nexora.Domain.Common;

namespace Nexora.Domain.Audit;

/// <summary>
/// One row per auditable operation. Written by AuditableEntitySaveChangesInterceptor
/// for every tracked insert/update/delete on entities marked IAuditable, plus
/// explicitly by handlers for actions that aren't simple CRUD (login, permission
/// changes, sync conflict resolutions).
/// </summary>
public class AuditLog : TenantEntity
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = default!;

    /// <summary>e.g. "ProductPriceChanged", "InvoiceCreated", "UserLoggedIn"</summary>
    public string Action { get; set; } = default!;

    public string EntityType { get; set; } = default!;
    public Guid? EntityId { get; set; }

    /// <summary>Serialized JSON snapshot of the entity before the change, when applicable.</summary>
    public string? BeforeState { get; set; }

    /// <summary>Serialized JSON snapshot of the entity after the change.</summary>
    public string? AfterState { get; set; }

    public string? IpAddress { get; set; }

    /// <summary>Which node the action originated from - cloud, or a specific local node id.</summary>
    public string SourceNode { get; set; } = "cloud";

    /// <summary>Ties this log entry to the request's correlation id for cross-referencing with logs/traces.</summary>
    public string? CorrelationId { get; set; }

    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;
}
