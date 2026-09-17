using Nexora.Domain.Notifications;

namespace Nexora.Application.Common.Notifications;

// The single entry point for creating a notification, used from any
// command handler that has something worth surfacing (payment received,
// low stock, a sync conflict). Keeps notification creation out of ad-hoc
// "just insert a row" calls scattered through handlers.
public interface INotificationService
{
    Task NotifyAsync(
        Guid organizationId, NotificationType type, string title, string message,
        string? entityType, Guid? entityId, CancellationToken cancellationToken);
}
