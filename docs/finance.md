# Finance Module (Phase 5)

## Scope: MVP finance core, not an accounting system

Per spec section 20, this is deliberately "a useful finance core without attempting to recreate an enterprise accounting system." No double-entry ledger, no tax engine, no bank reconciliation, no multi-currency — those are explicitly future-phase (spec section 20's own "Future" list).

What exists: a lightweight `Account` (chart-of-accounts-lite: name + type — Asset/Liability/Equity/Income/Expense), `Expense` records, `Income` records, and a dashboard query that pulls it together with Sales and Purchasing.

## A deliberate deviation from the Phase 0 schema

The Phase 0 architecture doc's ERD (section 7) lists `receivables` and `payables` as their own tables. This implementation does **not** create them. Instead, `GetFinancialSummaryQuery` computes receivables/payables live:

- **Receivables** = `SUM(Invoice.Total - Invoice.AmountPaid)` across every non-Paid, non-Cancelled Sales invoice.
- **Payables** = `SUM(SupplierInvoice.Total - SupplierInvoice.AmountPaid)` across every non-Paid supplier invoice.

The reasoning: a separate receivables/payables ledger table is *derived data* — its correct value is always a function of the invoices it's summarizing. Maintaining it as a separate table means either updating it in lockstep with every invoice/payment change (another place to forget, another opportunity for the two to drift apart) or accepting that it can silently go stale. Computing it on read avoids that failure mode entirely, at the cost of the query itself being slightly more expensive - a fine trade at Phase 5's data volumes, worth revisiting only if this specific query becomes a measured bottleneck.

If a future phase needs point-in-time historical receivables/payables snapshots (e.g. "what were our receivables as of last quarter-end" for a report), that's a different problem — a periodic snapshot table — not a reason to make the live figure a hand-maintained ledger.

## Income has two sources, deliberately not merged into one table

`GetFinancialSummaryQuery.Income` = standalone `Income` records + Sales `Payment` records in the date range. A customer payment is real income, but it's *Sales'* data (created by `RecordPaymentCommand`, per `docs/sales.md`) — Finance reads it rather than Sales writing a duplicate `Income` row every time a payment comes in. Same reasoning as the receivables point above: one source of truth, read from wherever it's needed, rather than copied.

`Expense.SupplierInvoiceId` is the one place this module writes into another module's data: `RecordExpenseCommand`, when given a `SupplierInvoiceId`, updates that `SupplierInvoice`'s `AmountPaid`/`Status` — this is what fills the gap flagged in `docs/purchasing.md` ("no command writes to SupplierInvoice.AmountPaid"). It's a small, deliberate exception to "modules don't reach into each other's data" because Purchasing has no payment-recording command of its own yet; if one gets built later, this logic should move there instead of living in Finance.

## Receivables/payables aging

`GetReceivablesAgingQuery` and `GetPayablesAgingQuery` bucket every open (non-Paid, non-Cancelled) invoice by days overdue - `Current`, `1-30`, `31-60`, `61-90`, `90+` - matching the aging view the newer commercial spec asks for. Both share one `AgingBuckets.Classify(daysOverdue)` helper so the bucket boundaries can't drift between receivables and payables. `daysOverdue` is `max(0, today - dueDate)` in whole days; an invoice not yet due always lands in `Current` regardless of how far in the future its due date is.

## What's NOT implemented yet

- Double-entry accounting, tax engine, bank reconciliation, multi-currency (explicitly future-phase per spec section 20)
- A `RecordPayment`-equivalent inside Purchasing itself — for now, settling a supplier invoice means calling `RecordExpenseCommand` with a `SupplierInvoiceId`, which is a little indirect
- Financial statements (P&L, balance sheet) — Analytics phase
- Budget tracking

## Permissions

| Action | Permission |
|---|---|
| View financial summary, transactions | `finance.read` |
| Create accounts, record income/expenses | `finance.create` |
| (Recording a Sales payment also requires `finance.create` — see `docs/sales.md`) | |
