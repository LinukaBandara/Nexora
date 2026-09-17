using Nexora.Domain.Common;

namespace Nexora.Domain.Purchasing;

/// <summary>
/// Records goods physically arriving. It is the mirror image of Sales'
/// CreateInvoiceFromSalesOrder: where invoicing a sale deducts stock,
/// receiving goods adds it - both go through StockMovementRecorder and
/// nothing else. See docs/purchasing.md.
/// </summary>
public class GoodsReceipt : TenantEntity
{
    public string Number { get; set; } = default!;

    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }

    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? Notes { get; set; }

    public ICollection<GoodsReceiptItem> Items { get; set; } = new List<GoodsReceiptItem>();
}

public class GoodsReceiptItem : TenantEntity
{
    public Guid GoodsReceiptId { get; set; }
    public GoodsReceipt? GoodsReceipt { get; set; }

    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}

public enum SupplierInvoiceStatus
{
    Unpaid,
    PartiallyPaid,
    Paid,
    Overdue,
}

/// <summary>
/// The supplier's bill for a purchase order - the Purchasing-side mirror
/// of Sales' Invoice. Phase 4 keeps this a simple record-and-track-payment
/// entity; it does not yet drive a Payable ledger entry automatically -
/// see docs/finance.md for how Phase 5 relates to this.
/// </summary>
public class SupplierInvoice : TenantEntity, IFinalizableDocument
{
    public string Number { get; set; } = default!; // supplier's own invoice number

    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }

    public Guid SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    public SupplierInvoiceStatus Status { get; set; } = SupplierInvoiceStatus.Unpaid;
    public DateOnly IssueDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly DueDate { get; set; }

    public decimal Total { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal AmountDue => Total - AmountPaid;

    public bool IsTerminalStatus(object status) =>
        status is SupplierInvoiceStatus s && s == SupplierInvoiceStatus.Paid;
}
