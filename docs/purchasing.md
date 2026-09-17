# Purchasing Module (Phase 4)

## Workflow

```
Purchase Order → Goods Receipt → Supplier Invoice
```

Deliberately the mirror image of Sales (`docs/sales.md`) — same create/approve split, same partial-fulfillment support, same Inventory integration pattern, just running in the opposite stock direction.

- **`CreatePurchaseOrderCommand`** — supplier + line items with unit *cost* (not selling price).
- **`ApprovePurchaseOrderCommand`** — separate command, gated by `purchasing.approve`, same reasoning as `ApproveSalesOrderCommand`.
- **`ReceiveGoodsCommand`** — supports partial/split deliveries via `PurchaseOrderItem.QuantityReceived`, exactly like invoicing supports partial fulfillment on the Sales side. This is the Inventory integration point: receiving goods **adds** stock through `StockMovementRecorder`, the mirror image of invoicing **deducting** it. See the second test in `tests/unit/Nexora.UnitTests/Purchasing/PurchasingWorkflowTests.cs` for a split delivery (6 then 4 of a 10-unit order) ending with the order correctly marked `Received` only once every line is fully covered.
- **`CreateSupplierInvoiceCommand`** — records the supplier's bill against a purchase order. Simpler than Sales' `Invoice` for now: no line items, no partial-payment tracking beyond `AmountPaid`/`AmountDue` on the entity itself, and nothing yet updates it when a payment is made (see "What's NOT implemented" below).

## A permission decision worth flagging (same shape as the one in Sales)

`POST /api/v1/purchasing/orders/{id}/receipts` is gated by `inventory.adjust`, not a purchasing permission — physically receiving goods into a warehouse is treated as an inventory action even though it's reached through a purchasing-shaped URL. This mirrors the Sales-side decision to gate payment recording by `finance.create` rather than a sales permission. Same caveat applies: confirm this is the split you actually want.

## What's NOT implemented yet

- `GetPurchaseOrderDetail` query (Sales has `GetInvoiceDetail`; Purchasing only has the list query so far — the detail screen has nothing to call yet)
- Recording *payments against* a supplier invoice directly within Purchasing — the entity has `AmountPaid`/`Status`, and Phase 5's `RecordExpenseCommand` can update them when given a `SupplierInvoiceId` (see `docs/finance.md`), but there's no Purchasing-owned command for it, which is a little indirect
- Purchase order → supplier-invoice quantity/amount reconciliation (nothing checks that a supplier invoice's `Total` matches what was actually ordered/received)
- Supplier performance metrics (spec section 41, "supplier analytics") — Analytics phase
- Update/cancel for purchase orders

## Permissions

| Action | Permission |
|---|---|
| View suppliers, purchase orders | `purchasing.read` |
| Create suppliers, purchase orders, supplier invoices | `purchasing.create` |
| Approve a purchase order | `purchasing.approve` |
| Receive goods | `inventory.adjust` (see note above) |
