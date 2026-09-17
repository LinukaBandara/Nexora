# NEXORA — Implementation Audit

Per the new spec's own section 70 ("Phase 1: Audit current implementation") and section 69 ("Do not break existing features... understand them before modifying"). This maps what's actually built against the new commercial bar, so nothing gets rewritten by accident.

## 1. What exists today

| Area | Status | Notes |
|---|---|---|
| Foundation (auth, multi-tenancy, RBAC, audit log) | Built | JWT + refresh rotation, permission-per-policy, automatic audit interceptor |
| Inventory | Built | Append-only `StockMovement` ledger, `StockMovementRecorder` as sole mutation path |
| Sales | Built | Quotation → Order → Invoice (partial) → Payment |
| Purchasing | Built | PO → Goods Receipt (partial/split) → Supplier Invoice |
| Finance | Built (MVP) | Income/Expense, receivables/payables computed live, aging buckets |
| Analytics | Built (MVP) | Dashboard, Sales, Inventory queries - real DB aggregation, no hardcoded numbers |
| Hybrid Sync | Built (core protocol) | Outbox capture, idempotency, versioning, per-type conflict policy, two real databases (`Nexora.LocalNode.Api`) |
| Document immutability | Built | `FinancialImmutabilityInterceptor` blocks edits to finalized documents |
| Notifications | Built (MVP) | Real table, three genuine trigger points, several types still unwired |
| Frontend | Not built | Design tokens + one static mockup only. No Next.js app, no screens, no chart components, no command palette, no global search UI |
| HR & Payroll | Not built | |
| AI / NEXORA Intelligence | Not built | |

## 2. Compliance check against this spec's non-negotiables

**Section 3 ("data must be real") — compliant by construction, not by retrofit.** Every analytics/dashboard query reads live from transactional tables. Nothing is hardcoded.

**Section 9 ("ledger UX - where did this number come from") — backend-ready, UI doesn't exist yet.** `StockMovement` carries timestamp, type, reference document, warehouse, quantity, and `QuantityOnHandAfter`. Still missing: an explicit `SyncState` field on business records (see section 3 below).

**Section 13 (financial document lifecycle) — now enforced, with one deliberate deviation.** `FinancialImmutabilityInterceptor` now blocks modification of any `Invoice`/`SalesOrder`/`PurchaseOrder`/`SupplierInvoice` once it's in a terminal status. The existing status enums were kept rather than renamed to the spec's literal `Draft/Posted` vocabulary - see `docs/document-lifecycle.md` for why.

**Section 52 (tenant isolation tested explicitly) — compliant.** `TenantIsolationTests` exists.

**Section 48 (decimal, not float, for money) — compliant.**

## 3. Gaps closed since the first version of this audit

1. **Document lifecycle enforcement** - see `docs/document-lifecycle.md`.
2. **Aging-bucket queries** - `GetReceivablesAgingQuery`/`GetPayablesAgingQuery`, see `docs/finance.md`.
3. **Notifications system** - real trigger points (payment received, low stock, sync conflict requiring review), see `docs/notifications.md`.

## 4. Remaining real gaps (backend/architecture, not just missing UI)

1. **No `SyncState` visible on business records.** A `StockMovement` or `Invoice` doesn't expose "has this synced yet" - the sync tables know, the business entity doesn't surface it.
2. **Currency is hardcoded implicitly.** Nothing formats money with a configurable currency/locale.
3. **No background job infrastructure.** RabbitMQ is in `docker-compose` but nothing publishes/consumes a message yet. `InvoiceOverdue` notifications specifically need a scheduled job that doesn't exist (see `docs/notifications.md`).

## 5. What this spec asks for that's genuinely new scope

Chart system, global search, command palette, report builder, aging UI, WhatsApp/SMS integration, i18n (Sinhala/Tamil), PWA/offline frontend, NEXORA Intelligence (AI), demo mode, real-time updates. None of these have backend foundation yet beyond what's incidentally reusable.

## Recommendation

The three most demo-critical backend gaps (lifecycle/immutability, aging buckets, notifications) are now closed. The next reasonable increment is starting the frontend design system → shell → dashboard, per the reconciled phase order - or closing the remaining background-jobs gap first if `InvoiceOverdue` notifications matter for an early demo.
