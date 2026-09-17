# Sales Module (Phase 3)

## Workflow

```
Quotation → Sales Order → Invoice → Payment
```

Matches spec section 18 exactly. Each step is its own command, not a monolithic "process sale" call, so a business can stop at any stage (a quotation that's never accepted, an approved order that's invoiced in two partial batches).

- **`CreateQuotationCommand`** — a customer + line items, snapshotting each product's name at the time of quoting (spec's "quoted price should still show what the customer was actually quoted" implication).
- **`ConvertQuotationToSalesOrderCommand`** — copies the quotation's lines onto a new `SalesOrder` in `PendingApproval` status, and marks the quotation `ConvertedToOrder`. A quotation can only be converted once.
- **`ApproveSalesOrderCommand`** — deliberately a separate command gated by `sales.approve`, not folded into creation. A salesperson can raise an order; a different permission is required to approve it before it can be invoiced. Mirrors the approval split the spec also asks for in Purchasing.
- **`CreateInvoiceFromSalesOrderCommand`** — supports **partial invoicing**: each line can invoice up to what remains uninvoiced on the order (`SalesOrderItem.QuantityInvoiced` tracks this). The order moves to `PartiallyInvoiced` or `Invoiced` depending on whether every line is fully covered.
- **`RecordPaymentCommand`** — one or more payments against an invoice; moves it to `PartiallyPaid` or `Paid`. Overpayment is rejected outright rather than silently creating a credit balance — credit notes are a later-phase feature (spec section 20's "future: multi-currency" list implies a fuller finance engine than Phase 3 needs).

## The Inventory integration point

`CreateInvoiceFromSalesOrderCommand` is where Sales and Inventory meet. Invoicing is treated as the point goods physically leave the business, so it's what deducts stock — through `StockMovementRecorder` (see `docs/inventory.md`), never by touching `InventoryItem` directly. If there isn't enough stock, the whole invoice creation fails and nothing is partially applied — see `tests/unit/Nexora.UnitTests/Sales/SalesWorkflowTests.cs`, specifically `CreateInvoice_WithInsufficientStock_ThrowsAndDoesNotPartiallyApply`.

This does mean Phase 3 has no separate "reserve stock at order approval" step — a sales order being `Approved` doesn't yet protect its stock from being sold to someone else before it's invoiced. `InventoryItem.QuantityReserved` exists in the schema for exactly this, but nothing writes to it yet. Worth having before this goes anywhere near real concurrent order volume.

## A permission decision worth flagging

Recording a payment (`POST /api/v1/sales/invoices/{id}/payments`) is gated by `finance.create`, not a sales permission — money received is treated as a Finance action even though it hangs off an invoice's URL. This mirrors how the default `Sales Manager` role (see `docs/authentication.md`) does **not** include `finance.*`, so a salesperson can create and invoice orders but can't independently record that money changed hands. Revisit this if that split turns out to be more friction than protection in practice.

## What's NOT implemented yet

- Sales returns (`sales_returns` table is in the Phase 0 schema, no entity/commands yet)
- Stock reservation at order-approval time (see above)
- Tax/discount line items — `Subtotal` and `Total` are currently identical everywhere; a real tax engine is explicitly deferred (spec section 20)
- Credit notes / overpayment handling
- Customer-facing PDF invoice generation (spec section 92, "Print/Document UI") — this is a frontend + Phase-7-ish concern, not blocked on anything here
- Update/cancel for quotations, sales orders, invoices

## Permissions

| Action | Permission |
|---|---|
| View customers, orders, invoices | `sales.read` |
| Create customers, quotations, convert to order, create invoices | `sales.create` |
| Approve a sales order | `sales.approve` |
| Record a payment | `finance.create` (see note above) |
