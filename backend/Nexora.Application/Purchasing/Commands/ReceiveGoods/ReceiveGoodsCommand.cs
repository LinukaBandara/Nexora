using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Inventory.Common;
using Nexora.Domain.Inventory;
using Nexora.Domain.Purchasing;

namespace Nexora.Application.Purchasing.Commands.ReceiveGoods;

public record GoodsReceiptLineInput(Guid PurchaseOrderItemId, int Quantity);

/// <summary>
/// Supports partial/split deliveries the same way CreateInvoiceFromSalesOrderCommand
/// supports partial invoicing - Quantity per line can be less than what remains
/// on the purchase order item. Adds stock through StockMovementRecorder; never
/// touches InventoryItem directly.
/// </summary>
public record ReceiveGoodsCommand(
    Guid PurchaseOrderId,
    IReadOnlyCollection<GoodsReceiptLineInput> Lines,
    string? Notes) : IRequest<Guid>;

public class ReceiveGoodsCommandValidator : AbstractValidator<ReceiveGoodsCommand>
{
    public ReceiveGoodsCommandValidator()
    {
        RuleFor(x => x.PurchaseOrderId).NotEmpty();
        RuleFor(x => x.Lines).NotEmpty();
        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            line.RuleFor(l => l.PurchaseOrderItemId).NotEmpty();
            line.RuleFor(l => l.Quantity).GreaterThan(0);
        });
    }
}

public class ReceiveGoodsCommandHandler : IRequestHandler<ReceiveGoodsCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly StockMovementRecorder _recorder;

    public ReceiveGoodsCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, StockMovementRecorder recorder)
    {
        _db = db;
        _currentUser = currentUser;
        _recorder = recorder;
    }

    public async Task<Guid> Handle(ReceiveGoodsCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var order = await _db.PurchaseOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.PurchaseOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Purchase order not found.");

        if (order.Status is not (PurchaseOrderStatus.Approved or PurchaseOrderStatus.PartiallyReceived))
            throw new InvalidOperationException(
                $"Only approved orders can receive goods (current status: {order.Status}). " +
                "Use ApprovePurchaseOrderCommand first.");

        var receipt = new GoodsReceipt
        {
            OrganizationId = organizationId,
            Number = $"GRN-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            PurchaseOrderId = order.Id,
            Notes = request.Notes,
        };

        foreach (var line in request.Lines)
        {
            var orderItem = order.Items.FirstOrDefault(i => i.Id == line.PurchaseOrderItemId)
                ?? throw new InvalidOperationException($"Line item {line.PurchaseOrderItemId} does not belong to this purchase order.");

            var remaining = orderItem.Quantity - orderItem.QuantityReceived;
            if (line.Quantity > remaining)
                throw new InvalidOperationException(
                    $"Cannot receive {line.Quantity} of '{orderItem.ProductNameSnapshot}' - only {remaining} remain outstanding.");

            receipt.Items.Add(new GoodsReceiptItem
            {
                OrganizationId = organizationId,
                ProductId = orderItem.ProductId,
                Quantity = line.Quantity,
            });

            orderItem.QuantityReceived += line.Quantity;

            // The integration point with Inventory - mirror image of the Sales
            // side's stock deduction at invoicing. Never a direct InventoryItem edit.
            await _recorder.RecordAsync(
                organizationId, orderItem.ProductId, order.WarehouseId,
                StockMovementType.Receipt, line.Quantity,
                nameof(GoodsReceipt), receipt.Id, notes: request.Notes, cancellationToken);
        }

        order.Status = order.Items.All(i => i.QuantityReceived >= i.Quantity)
            ? PurchaseOrderStatus.Received
            : PurchaseOrderStatus.PartiallyReceived;

        _db.GoodsReceipts.Add(receipt);
        await _db.SaveChangesAsync(cancellationToken);

        return receipt.Id;
    }
}
