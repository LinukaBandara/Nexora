using MediatR;
using Microsoft.AspNetCore.Mvc;
using Nexora.Api.Authorization;
using Nexora.Application.Common.Security;
using Nexora.Application.Purchasing.Commands.ApprovePurchaseOrder;
using Nexora.Application.Purchasing.Commands.CreatePurchaseOrder;
using Nexora.Application.Purchasing.Commands.CreateSupplier;
using Nexora.Application.Purchasing.Commands.CreateSupplierInvoice;
using Nexora.Application.Purchasing.Commands.ReceiveGoods;
using Nexora.Application.Purchasing.Queries.GetPurchaseOrders;
using Nexora.Application.Purchasing.Queries.GetSuppliers;
using Nexora.Domain.Purchasing;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/v1/purchasing")]
public class PurchasingController : ControllerBase
{
    private readonly ISender _mediator;

    public PurchasingController(ISender mediator) => _mediator = mediator;

    // ---- Suppliers ---------------------------------------------------------

    [HttpGet("suppliers")]
    [HasPermission(Permissions.Purchasing.Read)]
    public async Task<IActionResult> GetSuppliers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetSuppliersQuery(search, page, pageSize), ct);
        return Ok(result);
    }

    public record CreateSupplierRequest(string Name, string? Email, string? Phone, string? Address, int DefaultPaymentTermDays);

    [HttpPost("suppliers")]
    [HasPermission(Permissions.Purchasing.Create)]
    public async Task<IActionResult> CreateSupplier(CreateSupplierRequest request, CancellationToken ct)
    {
        var id = await _mediator.Send(new CreateSupplierCommand(
            request.Name, request.Email, request.Phone, request.Address, request.DefaultPaymentTermDays), ct);
        return Ok(new { id });
    }

    // ---- Purchase orders -------------------------------------------------------

    [HttpGet("orders")]
    [HasPermission(Permissions.Purchasing.Read)]
    public async Task<IActionResult> GetPurchaseOrders([FromQuery] PurchaseOrderStatus? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetPurchaseOrdersQuery(status, page, pageSize), ct);
        return Ok(result);
    }

    public record PurchaseOrderItemRequest(Guid ProductId, int Quantity, decimal UnitCost);
    public record CreatePurchaseOrderRequest(Guid SupplierId, Guid WarehouseId, string? Notes, IReadOnlyCollection<PurchaseOrderItemRequest> Items);

    [HttpPost("orders")]
    [HasPermission(Permissions.Purchasing.Create)]
    public async Task<IActionResult> CreatePurchaseOrder(CreatePurchaseOrderRequest request, CancellationToken ct)
    {
        var items = request.Items.Select(i => new PurchaseOrderItemInput(i.ProductId, i.Quantity, i.UnitCost)).ToList();
        var id = await _mediator.Send(new CreatePurchaseOrderCommand(request.SupplierId, request.WarehouseId, request.Notes, items), ct);
        return Ok(new { id });
    }

    [HttpPost("orders/{id:guid}/approve")]
    [HasPermission(Permissions.Purchasing.Approve)]
    public async Task<IActionResult> ApprovePurchaseOrder(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new ApprovePurchaseOrderCommand(id), ct);
        return NoContent();
    }

    // ---- Goods receiving -------------------------------------------------------

    public record GoodsReceiptLineRequest(Guid PurchaseOrderItemId, int Quantity);
    public record ReceiveGoodsRequest(IReadOnlyCollection<GoodsReceiptLineRequest> Lines, string? Notes);

    [HttpPost("orders/{id:guid}/receipts")]
    [HasPermission(Permissions.Inventory.Adjust)] // physically receiving stock is an inventory action - see docs/purchasing.md
    public async Task<IActionResult> ReceiveGoods(Guid id, ReceiveGoodsRequest request, CancellationToken ct)
    {
        var lines = request.Lines.Select(l => new GoodsReceiptLineInput(l.PurchaseOrderItemId, l.Quantity)).ToList();
        var receiptId = await _mediator.Send(new ReceiveGoodsCommand(id, lines, request.Notes), ct);
        return Ok(new { receiptId });
    }

    // ---- Supplier invoices -----------------------------------------------------

    public record CreateSupplierInvoiceRequest(string SupplierInvoiceNumber, decimal Total, DateOnly? DueDate);

    [HttpPost("orders/{id:guid}/supplier-invoices")]
    [HasPermission(Permissions.Purchasing.Create)]
    public async Task<IActionResult> CreateSupplierInvoice(Guid id, CreateSupplierInvoiceRequest request, CancellationToken ct)
    {
        var invoiceId = await _mediator.Send(new CreateSupplierInvoiceCommand(id, request.SupplierInvoiceNumber, request.Total, request.DueDate), ct);
        return Ok(new { invoiceId });
    }
}
