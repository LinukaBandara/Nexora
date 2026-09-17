using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Notifications;

namespace Nexora.Application.Common.Notifications;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _db;

    public NotificationService(IApplicationDbContext db) => _db = db;

    public Task NotifyAsync(
        Guid organizationId, NotificationType type, string title, string message,
        string? entityType, Guid? entityId, CancellationToken cancellationToken)
    {
        _db.Notifications.Add(new Notification
        {
            OrganizationId = organizationId,
            Type = type,
            Title = title,
            Message = message,
            EntityType = entityType,
            EntityId = entityId,
        });

        // Deliberately does not call SaveChangesAsync here - it rides
        // along in the same SaveChanges call as whatever business
        // operation triggered it, so the notification and the change
        // that caused it are always written in the same transaction.
        return Task.CompletedTask;
    }
}
