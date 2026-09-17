using Nexora.Domain.Common;

namespace Nexora.Domain.Notifications;

public enum NotificationType
{
    LowStock,
    InvoiceOverdue,
    PaymentReceived,
    PurchaseOrderReceived,
    SyncFailed,
    SyncConflict,
    ApprovalRequired,
    PayrollCompleted,
    SystemWarning,
}

// Org-wide by default (UserId null) - per-user targeting can be added
// later if role-scoped notification routing turns out to be needed.
public class Notification : TenantEntity
{
    public NotificationType Type { get; set; }
    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;

    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }

    public bool IsRead { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}
