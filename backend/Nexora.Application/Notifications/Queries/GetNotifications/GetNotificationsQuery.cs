using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Models;

namespace Nexora.Application.Notifications.Queries.GetNotifications;

public record GetNotificationsQuery(bool UnreadOnly, int Page = 1, int PageSize = 25) : IRequest<PagedResult<NotificationDto>>;

public record NotificationDto(
    Guid Id, string Type, string Title, string Message, string? EntityType, Guid? EntityId, bool IsRead, DateTimeOffset CreatedAt);

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, PagedResult<NotificationDto>>
{
    private readonly IApplicationDbContext _db;

    public GetNotificationsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Notifications.AsNoTracking();
        if (request.UnreadOnly)
            query = query.Where(n => !n.IsRead);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new NotificationDto(
                n.Id, n.Type.ToString(), n.Title, n.Message, n.EntityType, n.EntityId, n.IsRead, n.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<NotificationDto>(items, totalCount, request.Page, request.PageSize);
    }
}
