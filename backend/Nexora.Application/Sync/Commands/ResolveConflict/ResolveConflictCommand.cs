using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Sync;

namespace Nexora.Application.Sync.Commands.ResolveConflict;

public enum ConflictResolution { AcceptIncoming, KeepExisting }

public record ResolveConflictCommand(Guid ConflictId, ConflictResolution Resolution) : IRequest;

public class ResolveConflictCommandHandler : IRequestHandler<ResolveConflictCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ResolveConflictCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(ResolveConflictCommand request, CancellationToken cancellationToken)
    {
        var conflict = await _db.SyncConflicts.FirstOrDefaultAsync(c => c.Id == request.ConflictId, cancellationToken)
            ?? throw new KeyNotFoundException("Conflict not found.");

        if (conflict.Status != SyncConflictStatus.Open)
            throw new InvalidOperationException($"This conflict is already resolved (status: {conflict.Status}).");

        conflict.Status = request.Resolution == ConflictResolution.AcceptIncoming
            ? SyncConflictStatus.ResolvedAcceptIncoming
            : SyncConflictStatus.ResolvedKeepExisting;
        conflict.ResolvedByUserId = _currentUser.UserId;
        conflict.ResolvedAt = DateTimeOffset.UtcNow;

        // NOTE: this records the decision but does not yet push the accepted
        // side back out to the losing node/cloud - see docs/sync.md, "what's
        // not implemented", for why that's the honest next step rather than
        // something faked here.

        await _db.SaveChangesAsync(cancellationToken);
    }
}
