using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Inventory.Common;
using Nexora.Domain.Inventory;

namespace Nexora.Application.Inventory.Commands.TransferStock;

public record TransferStockItem(Guid ProductId, int Quantity);

/// <summary>
/// Creates and immediately completes a stock transfer - for Phase 2, transfers
/// are a single atomic step rather than a Draft → InTransit → Completed
/// workflow, since most small-business transfers are same-day/same-location.
/// The Draft/InTransit states remain on the entity for a later phase that
/// wants multi-day transfers with an explicit "goods dispatched" step.
/// </summary>
public record TransferStockCommand(
    Guid FromWarehouseId,
    Guid ToWarehouseId,
    IReadOnlyCollection<TransferStockItem> Items,
    string? Notes) : IRequest<Guid>;

public class TransferStockCommandValidator : AbstractValidator<TransferStockCommand>
{
    public TransferStockCommandValidator()
    {
        RuleFor(x => x.FromWarehouseId).NotEmpty();
        RuleFor(x => x.ToWarehouseId).NotEmpty();
        RuleFor(x => x).Must(x => x.FromWarehouseId != x.ToWarehouseId)
            .WithMessage("Source and destination warehouse must be different.");
        RuleFor(x => x.Items).NotEmpty().WithMessage("A transfer must include at least one product.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty();
            item.RuleFor(i => i.Quantity).GreaterThan(0);
        });
    }
}

public class TransferStockCommandHandler : IRequestHandler<TransferStockCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly StockMovementRecorder _recorder;

    public TransferStockCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, StockMovementRecorder recorder)
    {
        _db = db;
        _currentUser = currentUser;
        _recorder = recorder;
    }

    public async Task<Guid> Handle(TransferStockCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var referenceNumber = $"TRF-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

        var transfer = new StockTransfer
        {
            OrganizationId = organizationId,
            ReferenceNumber = referenceNumber,
            FromWarehouseId = request.FromWarehouseId,
            ToWarehouseId = request.ToWarehouseId,
            Notes = request.Notes,
            Status = StockTransferStatus.Completed,
            CompletedAt = DateTimeOffset.UtcNow,
        };
        _db.StockTransfers.Add(transfer);

        foreach (var item in request.Items)
        {
            _db.StockTransferItems.Add(new StockTransferItem
            {
                OrganizationId = organizationId,
                StockTransferId = transfer.Id,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
            });

            // Out of the source first - if this throws (insufficient stock),
            // nothing has been recorded at the destination either, since both
            // movements are written in the same SaveChanges transaction below.
            await _recorder.RecordAsync(
                organizationId, item.ProductId, request.FromWarehouseId,
                StockMovementType.TransferOut, item.Quantity,
                nameof(StockTransfer), transfer.Id, request.Notes, cancellationToken);

            await _recorder.RecordAsync(
                organizationId, item.ProductId, request.ToWarehouseId,
                StockMovementType.TransferIn, item.Quantity,
                nameof(StockTransfer), transfer.Id, request.Notes, cancellationToken);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return transfer.Id;
    }
}
