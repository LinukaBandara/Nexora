# Inventory Module (Phase 2)

## The core rule: movements are the source of truth

`InventoryItem.QuantityOnHand` is a **projection**, not the source of truth. The source of truth is the append-only `StockMovement` ledger. The only code allowed to change `QuantityOnHand` is `StockMovementRecorder` (`Nexora.Application/Inventory/Common/StockMovementRecorder.cs`) — every command that touches stock (receiving, selling, adjusting, transferring) goes through it, and nothing else writes to that column.

This matters for two reasons:

1. **It's what makes Hybrid Sync possible later** (Phase 6). Per the Phase 0 architecture doc section 8, inventory never syncs a final stock number between a local node and the cloud — it syncs the movements themselves, and each side replays the other's movements against its own history. Two nodes independently adjusting the same product's stock don't "conflict" in the usual sense; both movements just apply. That only works if `QuantityOnHand` really is nothing more than the sum of the movements — which is enforced today, in Phase 2, not retrofitted later.
2. **Stock can never go negative**, regardless of which module or code path is asking. `StockMovementRecorder.RecordAsync` throws before allowing an outgoing movement that would drive on-hand quantity below zero. See `tests/unit/Nexora.UnitTests/Inventory/StockMovementRecorderTests.cs`.

## What's implemented

- **Products** — CRUD create (update/delete not yet built), SKU unique per-organization, category + unit references, cost/selling price, reorder level.
- **Warehouses** — create (auto-creates a default "Main" `WarehouseLocation`); finer-grained locations exist in the schema but aren't yet exposed for picking/putaway workflows.
- **Stock adjustments** — a signed quantity delta with a reason (`StockCount`, `Damaged`, `Expired`, `Lost`, `Correction`, `Other`), always producing exactly one `StockMovement`.
- **Stock transfers** — move one or more products from one warehouse to another. Phase 2 keeps this a single atomic step (create + complete together) rather than the full `Draft → InTransit → Completed` workflow the entity supports — see the comment on `TransferStockCommand` for why, and what a later phase would add.
- **Queries** — a paginated/searchable product list (with a documented limitation around combining `lowStockOnly` with pagination — see the comment in `GetProductsQuery`), a product detail view with per-warehouse stock and recent movement history, and category/unit lookup endpoints (`GetCategoriesQuery`/`GetUnitsQuery`) added to back the frontend's create-product form with real data instead of a hardcoded dropdown.

## What's NOT implemented yet

- Update/delete for products, categories, units, warehouses
- Barcode scanning, batch/lot tracking, expiry tracking, serial numbers (explicitly Phase 2+ in the spec, section 17)
- Low-stock **notifications** (the data to compute "is this low stock" exists; nothing pushes a notification yet — that's the Notifications system, not yet built)
- Inventory valuation reporting (Analytics, Phase 7)
- The multi-step transfer workflow (Draft/InTransit) — schema supports it, no endpoint drives it yet

## Permissions

| Action | Permission |
|---|---|
| View products, stock levels, movement history | `inventory.read` |
| Create products, warehouses | `inventory.create` |
| Record stock adjustments, complete transfers | `inventory.adjust` |

(`inventory.update` and `inventory.delete` are defined in `Permissions` but have no endpoints to attach to yet, since update/delete aren't built.)
