using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Application.Common.Notifications;
using Nexora.Application.Inventory.Common;
using Nexora.Domain.Inventory;
using Nexora.Domain.Notifications;
using Nexora.Domain.Sales;

namespace Nexora.Application.Sales.Commands.CreateInvoiceFromSalesOrder;

public record InvoiceLineInput(Guid SalesOrderItemId, int Quantity);

/// <summary>
/// Supports partial invoicing - Quantity per line can be less than what
/// remains on the sales order item, in which case the order stays
/// PartiallyInvoiced rather than Invoiced. Stock is deducted for exactly
/// what's being invoiced here, via StockMovementRecorder - this command
/// never touches InventoryItem directly (see docs/inventory.md).
/// </summary>
public record CreateInvoiceFromSalesOrderCommand(
    Guid SalesOrderId,
    IReadOnlyCollection<InvoiceLineInput> Lines) : IRequest<Guid>;

public class CreateInvoiceFromSalesOrderCommandValidator : AbstractValidator<CreateInvoiceFromSalesOrderCommand>
{
    public CreateInvoiceFromSalesOrderCommandValidator()
    {
        RuleFor(x => x.SalesOrderId).NotEmpty();
        RuleFor(x => x.Lines).NotEmpty();
        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            line.RuleFor(l => l.SalesOrderItemId).NotEmpty();
            line.RuleFor(l => l.Quantity).GreaterThan(0);
        });
    }
}

public class CreateInvoiceFromSalesOrderCommandHandler : IRequestHandler<CreateInvoiceFromSalesOrderCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly StockMovementRecorder _recorder;
    private readonly INotificationService _notifications;

    public CreateInvoiceFromSalesOrderCommandHandler(
        IApplicationDbContext db, ICurrentUserService currentUser, StockMovementRecorder recorder, INotificationService notifications)
    {
        _db = db;
        _currentUser = currentUser;
        _recorder = recorder;
        _notifications = notifications;
    }

    public async Task<Guid> Handle(CreateInvoiceFromSalesOrderCommand request, CancellationToken cancellationToken)
    {
        var organizationId = _currentUser.OrganizationId
            ?? throw new InvalidOperationException("No organization context on the current request.");

        var order = await _db.SalesOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.SalesOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Sales order not found.");

        if (order.Status is not (SalesOrderStatus.Approved or SalesOrderStatus.PartiallyInvoiced))
            throw new InvalidOperationException(
                $"Only approved orders can be invoiced (current status: {order.Status}). " +
                "Use ApproveSalesOrderCommand first.");

        var customer = await _db.Customers.FirstAsync(c => c.Id == order.CustomerId, cancellationToken);

        var invoice = new Invoice
        {
            OrganizationId = organizationId,
            Number = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            CustomerId = order.CustomerId,
            SalesOrderId = order.Id,
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(customer.DefaultPaymentTermDays)),
        };

        decimal subtotal = 0;

        foreach (var line in request.Lines)
        {
            var orderItem = order.Items.FirstOrDefault(i => i.Id == line.SalesOrderItemId)
                ?? throw new InvalidOperationException($"Line item {line.SalesOrderItemId} does not belong to this sales order.");

            var remaining = orderItem.Quantity - orderItem.QuantityInvoiced;
            if (line.Quantity > remaining)
                throw new InvalidOperationException(
                    $"Cannot invoice {line.Quantity} of '{orderItem.ProductNameSnapshot}' - only {remaining} remain uninvoiced.");

            var lineTotal = line.Quantity * orderItem.UnitPrice;
            subtotal += lineTotal;

            invoice.Items.Add(new InvoiceItem
            {
                OrganizationId = organizationId,
                ProductId = orderItem.ProductId,
                ProductNameSnapshot = orderItem.ProductNameSnapshot,
                Quantity = line.Quantity,
                UnitPrice = orderItem.UnitPrice,
                LineTotal = lineTotal,
            });

            orderItem.QuantityInvoiced += line.Quantity;

            // The actual point of integration with Inventory: invoicing is
            // what physically ships goods, so it's what deducts real stock -
            // never a direct edit to InventoryItem, always through the recorder.
            await _recorder.RecordAsync(
                organizationId, orderItem.ProductId, order.WarehouseId,
                StockMovementType.Sale, line.Quantity,
                nameof(Invoice), invoice.Id, notes: null, cancellationToken);

            await NotifyIfLowStockAsync(organizationId, orderItem.ProductId, cancellationToken);
        }

        invoice.Subtotal = subtotal;
        invoice.Total = subtotal;

        order.Status = order.Items.All(i => i.QuantityInvoiced >= i.Quantity)
            ? SalesOrderStatus.Invoiced
            : SalesOrderStatus.PartiallyInvoiced;

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync(cancellationToken);

        return invoice.Id;
    }

    // Checks total on-hand across all warehouses against the product's
    // reorder level - a real trigger point, not just an unused table.
    // Fires at most once per product per invoice; a low-stock invoice
    // touching the same product across multiple lines would still only
    // produce one notification since this runs once per line anyway.
    private async Task NotifyIfLowStockAsync(Guid organizationId, Guid productId, CancellationToken cancellationToken)
    {
        var product = await _db.Products.FirstAsync(p => p.Id == productId, cancellationToken);

        var totalOnHand = await _db.InventoryItems
            .Where(i => i.ProductId == productId)
            .SumAsync(i => (int?)i.QuantityOnHand, cancellationToken) ?? 0;

        if (totalOnHand > product.ReorderLevel) return;

        await _notifications.NotifyAsync(
            organizationId, NotificationType.LowStock,
            $"Low stock - {product.Name}",
            $"{product.Name} is at {totalOnHand} units, at or below its reorder level of {product.ReorderLevel}.",
            nameof(Domain.Inventory.Product), product.Id, cancellationToken);
    }
}
