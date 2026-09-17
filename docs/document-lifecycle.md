# Document Lifecycle & Immutability

## The rule

Once a financial or commercial document reaches a terminal status, it can never be modified again - only new, separate, auditable transactions can affect it further. This is enforced in code, not just by convention: `FinancialImmutabilityInterceptor` runs on every `SaveChanges` call and throws `InvalidOperationException` if it finds a tracked entity whose status was *already* terminal before this change.

| Entity | Terminal statuses |
|---|---|
| `Invoice` | `Paid`, `Cancelled` |
| `SalesOrder` | `Invoiced`, `Cancelled` |
| `PurchaseOrder` | `Received`, `Cancelled` |
| `SupplierInvoice` | `Paid` |

## A deliberate deviation from the literal spec wording

The newer commercial spec asks for a generic `Draft → Pending Approval → Approved → Posted → Paid → Cancelled` lifecycle on every financial document. This implementation does **not** rename the existing status enums to match that vocabulary exactly - `SalesOrderStatus` still has `PendingApproval`/`Approved`/`PartiallyInvoiced`/`Invoiced`/`Cancelled`, not `Draft`/`Posted`. Renaming enums used throughout Sales, Purchasing, Finance, and their tests would touch a large surface area for a cosmetic vocabulary change, and risks exactly what an earlier spec explicitly warned against ("do not rewrite working systems merely for stylistic reasons").

What actually matters from that request - **a document can't be silently edited once it's done** - is implemented for real via `IFinalizableDocument` and the interceptor, using each entity's own existing status enum. If a future phase needs the exact `Draft`/`Posted` vocabulary (e.g., because the frontend's document-lifecycle visualization depends on it), that's a naming/mapping exercise on top of working enforcement, not a rebuild of it.

## How the guard works

`IFinalizableDocument.IsTerminalStatus(object status)` is implemented per-entity, so each entity defines what "terminal" means for its own enum type. The interceptor:

1. Finds every tracked entity in `EntityState.Modified` that implements `IFinalizableDocument`.
2. Reads that entity's **original** `Status` value (the value before this change) via EF Core's change tracking.
3. If the original value was already terminal, throws - regardless of what the new value would be.

Critically, this only blocks changes made *after* a document is already finalized. The transition *into* a terminal state (e.g., `RecordPaymentCommand` moving an invoice from `PartiallyPaid` to `Paid`) is unaffected, because the original status at that point isn't terminal yet. See `tests/unit/Nexora.UnitTests/Documents/FinancialImmutabilityTests.cs` - both directions are tested explicitly.

## What this doesn't do yet

- No `Cancel` command exists for any of these entities yet, so `Cancelled` is currently unreachable in practice - the guard is ready for it, nothing produces it yet.
- No explicit "correction" workflow (e.g., a credit note that reverses a paid invoice) - the guard just stops the bad thing (silent edits); it doesn't yet provide the good thing (a structured way to correct a mistake after the fact).
