# Notifications

## What exists

A `Notification` table (org-wide, not per-user yet), `INotificationService.NotifyAsync(...)` as the single creation point, `GetNotificationsQuery` (paginated, filterable to unread-only), `MarkNotificationReadCommand`, and `NotificationsController`.

`NotifyAsync` deliberately does **not** call `SaveChangesAsync` itself - it adds to the same `IApplicationDbContext` the calling command is already using, so the notification and the business change that triggered it are always written in the same database transaction. A payment can't be recorded without its notification also landing, and vice versa.

## Real trigger points (not just an unused table)

| Trigger | Where | Notification type |
|---|---|---|
| A customer payment is recorded | `RecordPaymentCommand` (Sales) | `PaymentReceived` |
| Invoicing drives a product's total stock at or below its reorder level | `CreateInvoiceFromSalesOrderCommand` (Sales), after each stock deduction | `LowStock` |
| A sync event conflicts on a financial/commercial document (never auto-resolved) | `ReceiveSyncEventsCommand` (Sync) | `SyncConflict` |

Each is tested end-to-end - see `tests/unit/Nexora.UnitTests/Sales/SalesWorkflowTests.cs` (payment + low stock) and `tests/unit/Nexora.UnitTests/Sync/ReceiveSyncEventsTests.cs` (sync conflict).

**Deliberately not notified:** an auto-resolved master-data conflict (e.g., a `Product` version mismatch resolved last-write-wins) does NOT create a notification - it's logged as a `SyncConflict` record for traceability, but nobody needs to be paged about something the system already handled correctly. See the `Product_VersionMismatch_..._WithoutNotifying` test.

## Known limitations, stated plainly

- **Low-stock notifications aren't deduplicated.** If a product stays below its reorder level across several subsequent sales, each one fires a new notification rather than recognizing "we already flagged this." A real implementation would check for an existing unresolved low-stock notification for that product before creating another.
- **Org-wide, not role- or user-targeted.** Every notification is visible to anyone who can call `GET /api/v1/notifications` in that organization - there's no routing logic yet (e.g., only Finance-permission users seeing `PaymentReceived`). `Notification.UserId` doesn't exist yet; adding it is the natural next step if this becomes noisy in practice.
- **`InvoiceOverdue`, `PurchaseOrderReceived`, `ApprovalRequired`, `PayrollCompleted`, `SystemWarning`, `SyncFailed` are defined as `NotificationType` values but nothing generates them yet.** `InvoiceOverdue` in particular needs a scheduled job (nothing currently scans for invoices that just crossed their due date - see the background-jobs gap in `docs/audit/phase1-audit.md`), not a per-request trigger.
- No delivery beyond the in-app list - no email/WhatsApp/SMS (WhatsApp is explicitly a later regional-market feature, see the original spec's section 46).

## Permissions

Currently gated only by `[Authorize]` (any authenticated user in the organization), not a specific permission code - notifications are read-only personal/org information, not a sensitive business record in the same sense as an invoice.
