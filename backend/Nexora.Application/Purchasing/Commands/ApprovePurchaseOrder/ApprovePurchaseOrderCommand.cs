using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Purchasing;

namespace Nexora.Application.Purchasing.Commands.ApprovePurchaseOrder;

public record ApprovePurchaseOrderCommand(Guid PurchaseOrderId) : IRequest;

public class ApprovePurchaseOrderCommandHandler : IRequestHandler<ApprovePurchaseOrderCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ApprovePurchaseOrderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(ApprovePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _db.PurchaseOrders.FirstOrDefaultAsync(o => o.Id == request.PurchaseOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Purchase order not found.");

        if (order.Status != PurchaseOrderStatus.PendingApproval)
            throw new InvalidOperationException($"Only orders pending approval can be approved (current status: {order.Status}).");

        order.Status = PurchaseOrderStatus.Approved;
        order.ApprovedByUserId = _currentUser.UserId;
        order.ApprovedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}
