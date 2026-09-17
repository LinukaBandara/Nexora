using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sync;

namespace Nexora.Application.Sync.Queries.GetSyncStatus;

public record GetSyncStatusQuery : IRequest<SyncStatusDto>;

public record SyncEventStreamItemDto(string AggregateType, string EventType, string Outcome, DateTimeOffset At);

public record SyncStatusDto(
    int PendingEvents,
    int SyncedToday,
    int FailedEvents,
    int OpenConflicts,
    DateTimeOffset? LastSyncedAt,
    IReadOnlyCollection<SyncEventStreamItemDto> RecentEvents);

public class GetSyncStatusQueryHandler : IRequestHandler<GetSyncStatusQuery, SyncStatusDto>
{
    private readonly IApplicationDbContext _db;

    public GetSyncStatusQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<SyncStatusDto> Handle(GetSyncStatusQuery request, CancellationToken cancellationToken)
    {
        var todayStart = DateTimeOffset.UtcNow.Date;

        var pending = await _db.SyncOutboxEvents
            .CountAsync(e => e.Status == SyncOutboxStatus.Pending, cancellationToken);

        var syncedToday = await _db.SyncOutboxEvents
            .CountAsync(e => e.Status == SyncOutboxStatus.Acknowledged && e.LastAttemptAt >= todayStart, cancellationToken);

        var failed = await _db.SyncOutboxEvents
            .CountAsync(e => e.Status == SyncOutboxStatus.Failed, cancellationToken);

        var openConflicts = await _db.SyncConflicts
            .CountAsync(c => c.Status == SyncConflictStatus.Open, cancellationToken);

        var lastSyncedAt = await _db.SyncOutboxEvents
            .Where(e => e.Status == SyncOutboxStatus.Acknowledged)
            .OrderByDescending(e => e.LastAttemptAt)
            .Select(e => e.LastAttemptAt)
            .FirstOrDefaultAsync(cancellationToken);

        var recentOutbox = await _db.SyncOutboxEvents
            .OrderByDescending(e => e.CreatedAt)
            .Take(20)
            .Select(e => new SyncEventStreamItemDto(
                e.AggregateType, e.EventType.ToString(), e.Status.ToString(), e.LastAttemptAt ?? e.CreatedAt))
            .ToListAsync(cancellationToken);

        return new SyncStatusDto(pending, syncedToday, failed, openConflicts, lastSyncedAt, recentOutbox);
    }
}
