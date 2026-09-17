using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sales;

namespace Nexora.Application.Sales.Commands.ApproveSalesOrder;

/// <summary>
/// Deliberately its own command, gated by Permissions.Sales.Approve rather
/// than Sales.Create - a salesperson can raise an order, but a separate
/// approval step (and separate permission) is required before it can be
/// invoiced. Mirrors the same create/approve split used for purchasing.
/// </summary>
public record ApproveSalesOrderCommand(Guid SalesOrderId) : IRequest;

public class ApproveSalesOrderCommandHandler : IRequestHandler<ApproveSalesOrderCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ApproveSalesOrderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(ApproveSalesOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _db.SalesOrders.FirstOrDefaultAsync(o => o.Id == request.SalesOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Sales order not found.");

        if (order.Status != SalesOrderStatus.PendingApproval)
            throw new InvalidOperationException($"Only orders pending approval can be approved (current status: {order.Status}).");

        order.Status = SalesOrderStatus.Approved;
        order.ApprovedByUserId = _currentUser.UserId;
        order.ApprovedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}
