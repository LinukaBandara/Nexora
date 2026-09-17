# Analytics Module (Phase 7)

Read-only aggregation across every other module - no new business entities, only queries. Matches the Phase 0 module map's description of Analytics: "read-only aggregation/reporting across modules."

## What's implemented

- **`GetDashboardOverviewQuery`** — the executive dashboard (spec section 23): revenue, order count, inventory value, outstanding receivables, a daily revenue trend, top 5 products by revenue, up to 10 low-stock alerts, and the 10 most recent audit log entries as a recent-activity feed. That last one is deliberate: rather than separately tracking "what happened recently" per module, it reads `AuditLog`, which already captures every change centrally (see `docs/database.md`).
- **`GetSalesAnalyticsQuery`** — total revenue, order count, average order value, and top 5 customers by revenue for a date range.
- **`GetInventoryAnalyticsQuery`** — total stock value, low/out-of-stock counts, a daily stock-movement trend (units in vs. out), and stock value broken down by warehouse.

## A deliberate scope decision

Every query here reads live from the owning module's tables (`Invoice`, `SalesOrder`, `InventoryItem`, `StockMovement`, ...) rather than through a separate reporting/materialized-view layer. Same reasoning as Finance's receivables/payables (`docs/finance.md`): a cached/duplicated reporting layer is another thing to keep in sync and another opportunity to drift from the source of truth. This is fine at Phase 7's expected data volumes. If dashboard queries become a measured performance problem once transaction counts grow, the right fix is a proper read-model (materialized views refreshed on a schedule, or a dedicated reporting replica) — not something to build preemptively before there's a real number showing it's needed.

## What's NOT implemented yet

- Drill-down/filter-by-branch (spec section 48's `[Branch ▾]` control) — queries are organization-wide, not yet branch-scoped
- Export (PDF/CSV) — spec section 49's `[Export PDF] [Export CSV]` buttons have no backend endpoint yet
- Finance analytics, customer analytics, HR analytics (only Sales and Inventory analytics exist so far)
- Demand forecasting, anomaly detection, and the AI copilot (spec sections 44-46, "NEXORA Intelligence") — a substantial future phase in its own right, not attempted here

## Permissions

| Action | Permission |
|---|---|
| View any analytics/dashboard endpoint | `analytics.view` |
