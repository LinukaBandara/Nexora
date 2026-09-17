using MediatR;
using Microsoft.AspNetCore.Mvc;
using Nexora.Api.Authorization;
using Nexora.Application.Common.Security;
using Nexora.Application.Sales.Commands.ApproveSalesOrder;
using Nexora.Application.Sales.Commands.ConvertQuotationToSalesOrder;
using Nexora.Application.Sales.Commands.CreateCustomer;
using Nexora.Application.Sales.Commands.CreateInvoiceFromSalesOrder;
using Nexora.Application.Sales.Commands.CreateQuotation;
using Nexora.Application.Sales.Commands.RecordPayment;
using Nexora.Application.Sales.Queries.GetCustomers;
using Nexora.Application.Sales.Queries.GetInvoiceDetail;
using Nexora.Application.Sales.Queries.GetSalesOrders;
using Nexora.Domain.Sales;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/v1/sales")]
public class SalesController : ControllerBase
{
    private readonly ISender _mediator;

    public SalesController(ISender mediator) => _mediator = mediator;

    // ---- Customers ---------------------------------------------------------

    [HttpGet("customers")]
    [HasPermission(Permissions.Sales.Read)]
    public async Task<IActionResult> GetCustomers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetCustomersQuery(search, page, pageSize), ct);
        return Ok(result);
    }

    public record CreateCustomerRequest(string Name, string? Email, string? Phone, int DefaultPaymentTermDays, decimal? CreditLimit);

    [HttpPost("customers")]
    [HasPermission(Permissions.Sales.Create)]
    public async Task<IActionResult> CreateCustomer(CreateCustomerRequest request, CancellationToken ct)
    {
        var id = await _mediator.Send(new CreateCustomerCommand(
            request.Name, request.Email, request.Phone, request.DefaultPaymentTermDays, request.CreditLimit), ct);
        return Ok(new { id });
    }

    // ---- Quotations -------------------------------------------------------

    public record QuotationItemRequest(Guid ProductId, int Quantity, decimal UnitPrice);
    public record CreateQuotationRequest(Guid CustomerId, DateOnly? ExpiryDate, string? Notes, IReadOnlyCollection<QuotationItemRequest> Items);

    [HttpPost("quotations")]
    [HasPermission(Permissions.Sales.Create)]
    public async Task<IActionResult> CreateQuotation(CreateQuotationRequest request, CancellationToken ct)
    {
        var items = request.Items.Select(i => new QuotationItemInput(i.ProductId, i.Quantity, i.UnitPrice)).ToList();
        var id = await _mediator.Send(new CreateQuotationCommand(request.CustomerId, request.ExpiryDate, request.Notes, items), ct);
        return Ok(new { id });
    }

    public record ConvertQuotationRequest(Guid WarehouseId);

    [HttpPost("quotations/{id:guid}/convert")]
    [HasPermission(Permissions.Sales.Create)]
    public async Task<IActionResult> ConvertQuotation(Guid id, ConvertQuotationRequest request, CancellationToken ct)
    {
        var orderId = await _mediator.Send(new ConvertQuotationToSalesOrderCommand(id, request.WarehouseId), ct);
        return Ok(new { salesOrderId = orderId });
    }

    // ---- Sales orders -------------------------------------------------------

    [HttpGet("orders")]
    [HasPermission(Permissions.Sales.Read)]
    public async Task<IActionResult> GetSalesOrders([FromQuery] SalesOrderStatus? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetSalesOrdersQuery(status, page, pageSize), ct);
        return Ok(result);
    }

    [HttpPost("orders/{id:guid}/approve")]
    [HasPermission(Permissions.Sales.Approve)]
    public async Task<IActionResult> ApproveSalesOrder(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new ApproveSalesOrderCommand(id), ct);
        return NoContent();
    }

    // ---- Invoices -------------------------------------------------------------

    public record InvoiceLineRequest(Guid SalesOrderItemId, int Quantity);
    public record CreateInvoiceRequest(IReadOnlyCollection<InvoiceLineRequest> Lines);

    [HttpPost("orders/{id:guid}/invoices")]
    [HasPermission(Permissions.Sales.Create)]
    public async Task<IActionResult> CreateInvoice(Guid id, CreateInvoiceRequest request, CancellationToken ct)
    {
        var lines = request.Lines.Select(l => new InvoiceLineInput(l.SalesOrderItemId, l.Quantity)).ToList();
        var invoiceId = await _mediator.Send(new CreateInvoiceFromSalesOrderCommand(id, lines), ct);
        return Ok(new { invoiceId });
    }

    [HttpGet("invoices/{id:guid}")]
    [HasPermission(Permissions.Sales.Read)]
    public async Task<IActionResult> GetInvoiceDetail(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetInvoiceDetailQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    // ---- Payments ---------------------------------------------------------------

    public record RecordPaymentRequest(decimal Amount, PaymentMethod Method, string? Reference, string? Notes);

    [HttpPost("invoices/{id:guid}/payments")]
    [HasPermission(Permissions.Finance.Create)] // recording money received is a Finance action, not a Sales one - see docs/sales.md
    public async Task<IActionResult> RecordPayment(Guid id, RecordPaymentRequest request, CancellationToken ct)
    {
        var paymentId = await _mediator.Send(new RecordPaymentCommand(id, request.Amount, request.Method, request.Reference, request.Notes), ct);
        return Ok(new { paymentId });
    }
}
