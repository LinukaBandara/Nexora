using MediatR;
using Microsoft.AspNetCore.Mvc;
using Nexora.Api.Authorization;
using Nexora.Application.Common.Security;
using Nexora.Application.Inventory.Commands.AdjustStock;
using Nexora.Application.Inventory.Commands.CreateProduct;
using Nexora.Application.Inventory.Commands.CreateWarehouse;
using Nexora.Application.Inventory.Commands.TransferStock;
using Nexora.Application.Inventory.Queries.GetCategories;
using Nexora.Application.Inventory.Queries.GetProductDetail;
using Nexora.Application.Inventory.Queries.GetProducts;
using Nexora.Application.Inventory.Queries.GetUnits;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/v1/inventory")]
public class InventoryController : ControllerBase
{
    private readonly ISender _mediator;

    public InventoryController(ISender mediator) => _mediator = mediator;

    // ---- Products ---------------------------------------------------------

    [HttpGet("products")]
    [HasPermission(Permissions.Inventory.Read)]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? search, [FromQuery] Guid? categoryId, [FromQuery] bool lowStockOnly = false,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetProductsQuery(search, categoryId, lowStockOnly, page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("products/{id:guid}")]
    [HasPermission(Permissions.Inventory.Read)]
    public async Task<IActionResult> GetProductDetail(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetProductDetailQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    public record CreateProductRequest(
        string Sku, string Name, string? Description, Guid CategoryId, Guid UnitId,
        decimal CostPrice, decimal SellingPrice, int ReorderLevel);

    [HttpPost("products")]
    [HasPermission(Permissions.Inventory.Create)]
    public async Task<IActionResult> CreateProduct(CreateProductRequest request, CancellationToken ct)
    {
        var id = await _mediator.Send(new CreateProductCommand(
            request.Sku, request.Name, request.Description, request.CategoryId,
            request.UnitId, request.CostPrice, request.SellingPrice, request.ReorderLevel), ct);

        return CreatedAtAction(nameof(GetProductDetail), new { id }, new { id });
    }

    // ---- Lookups (for create-product forms etc - real data, not a hardcoded dropdown) ----

    [HttpGet("categories")]
    [HasPermission(Permissions.Inventory.Read)]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCategoriesQuery(), ct);
        return Ok(result);
    }

    [HttpGet("units")]
    [HasPermission(Permissions.Inventory.Read)]
    public async Task<IActionResult> GetUnits(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetUnitsQuery(), ct);
        return Ok(result);
    }

    // ---- Warehouses ---------------------------------------------------------

    public record CreateWarehouseRequest(string Name, string? Code, string? Address);

    [HttpPost("warehouses")]
    [HasPermission(Permissions.Inventory.Create)]
    public async Task<IActionResult> CreateWarehouse(CreateWarehouseRequest request, CancellationToken ct)
    {
        var id = await _mediator.Send(new CreateWarehouseCommand(request.Name, request.Code, request.Address), ct);
        return Ok(new { id });
    }

    // ---- Stock adjustments ---------------------------------------------------

    public record AdjustStockRequest(
        Guid ProductId, Guid WarehouseId, int QuantityDelta,
        Domain.Inventory.StockAdjustmentReason Reason, string? Notes);

    [HttpPost("stock-adjustments")]
    [HasPermission(Permissions.Inventory.Adjust)]
    public async Task<IActionResult> AdjustStock(AdjustStockRequest request, CancellationToken ct)
    {
        var id = await _mediator.Send(new AdjustStockCommand(
            request.ProductId, request.WarehouseId, request.QuantityDelta, request.Reason, request.Notes), ct);
        return Ok(new { id });
    }

    // ---- Stock transfers -------------------------------------------------------

    public record TransferStockItemRequest(Guid ProductId, int Quantity);
    public record TransferStockRequest(
        Guid FromWarehouseId, Guid ToWarehouseId, IReadOnlyCollection<TransferStockItemRequest> Items, string? Notes);

    [HttpPost("stock-transfers")]
    [HasPermission(Permissions.Inventory.Adjust)]
    public async Task<IActionResult> TransferStock(TransferStockRequest request, CancellationToken ct)
    {
        var items = request.Items.Select(i => new TransferStockItem(i.ProductId, i.Quantity)).ToList();
        var id = await _mediator.Send(new TransferStockCommand(
            request.FromWarehouseId, request.ToWarehouseId, items, request.Notes), ct);
        return Ok(new { id });
    }
}
