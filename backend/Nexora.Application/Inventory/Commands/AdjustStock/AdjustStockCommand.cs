using FluentValidation;
using MediatR;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Inventory.Common;
using Nexora.Domain.Inventory;

namespace Nexora.Application.Inventory.Commands.AdjustStock;

/// <summary>Quantity is a signed delta: positive = stock found/added, negative = stock removed/written off.</summary>
public record AdjustStockCommand(
    Guid ProductId,
    Guid WarehouseId,
    int QuantityDelta,
    StockAdjustmentReason Reason,
    string? Notes) : IRequest<Guid>;

public class AdjustStockCommandValidator : AbstractValidator<AdjustStockCommand>
{
    public AdjustStockCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.WarehouseId).NotEmpty();
        RuleFor(x => x.QuantityDelta).NotEqual(0).WithMessage("A stock adjustment must change the quantity by a non-zero amount.");
    }
}

public class AdjustStockCommandHandler : IRequestHandler<AdjustStockCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly StockMovementRecorder _recorder;

    public AdjustStockCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, StockMovementRecorder recorder)
    {
        _db = db;
        _currentUser = currentUser;
        _recorder = recorder;
    }

    public async Task<Guid> Handle(AdjustStockCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var adjustment = new StockAdjustment
        {
            OrganizationId = organizationId,
            ProductId = request.ProductId,
            WarehouseId = request.WarehouseId,
            QuantityDelta = request.QuantityDelta,
            Reason = request.Reason,
            Notes = request.Notes,
        };
        _db.StockAdjustments.Add(adjustment);

        var movementType = request.QuantityDelta > 0
            ? StockMovementType.AdjustmentIn
            : StockMovementType.AdjustmentOut;

        var movement = await _recorder.RecordAsync(
            organizationId,
            request.ProductId,
            request.WarehouseId,
            movementType,
            Math.Abs(request.QuantityDelta),
            referenceType: nameof(StockAdjustment),
            referenceId: adjustment.Id,
            notes: request.Notes,
            cancellationToken);

        adjustment.ResultingMovementId = movement.Id;

        await _db.SaveChangesAsync(cancellationToken);
        return adjustment.Id;
    }
}
