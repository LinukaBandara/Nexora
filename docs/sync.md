# Hybrid Sync Module (Phase 6)

This is the hardest, least-precedented part of NEXORA, and the part most worth being precise about what's real versus what's a deliberately-scoped placeholder.

## What's real

**Outbox capture is automatic.** `SyncOutboxInterceptor` runs on every `SaveChanges` call and writes a `SyncOutboxEvent` for any tracked entity implementing `ISyncableAggregate` that was added or modified - no command handler anywhere calls "record this for sync" by hand. It also increments the entity's `Version` on every update, which is what makes the receiving side's version comparison meaningful. See `tests/unit/Nexora.UnitTests/Sync/SyncOutboxCaptureTests.cs`.

**The receiving protocol is real and tested**, not simulated:
- **Idempotency** - `SyncInboxEvent.IdempotencyKey` is unique; a duplicate delivery (network retry, worker restart) is recognized and acknowledged without reapplying anything.
- **Versioning** - `SyncCheckpoint` tracks the last version accepted per (node, aggregate). An incoming event that isn't exactly checkpoint+1 doesn't match what's expected.
- **Per-entity-type conflict policy**, matching the Phase 0 doc's design:
  - `StockMovement` is append-only and never conflicts by construction - any version applies, in whatever order it arrives. This is the payoff of Inventory syncing movements instead of a final stock number.
  - `SalesOrder`, `Invoice`, `Payment`, `PurchaseOrder` are never auto-resolved. A version mismatch always becomes an Open `SyncConflict` for a human to review.
  - Everything else (e.g. `Product` master data) resolves last-write-wins, but still logs a `SyncConflict` for visibility.

See `tests/unit/Nexora.UnitTests/Sync/ReceiveSyncEventsTests.cs` for all three policies exercised directly.

**The worker is real.** `SyncWorker` polls the outbox, batches pending events, POSTs them with a node secret header, and handles connection failure, non-2xx responses, and per-event conflict outcomes differently. Disabled by default (`Sync:Enabled = false`).

**Two genuinely separate databases, not one pretending to be two.** `Nexora.LocalNode.Api` exists as an actual second deployable, reusing the same Domain/Application/Infrastructure stack and the same auth/tenancy/controller wiring as the cloud API via `Nexora.Api/HostConfiguration.cs`, which both hosts call into. It differs only in: its own connection string (its own Postgres), `Sync:Enabled = true` instead of dev seeding, and seeding only the permission catalog locally, not cloud demo data. `docker-compose.yml` runs a genuinely separate `node_postgres` alongside the cloud's `postgres`, plus the `local-node` service. Outbox capture on the node writes to the node's own database; `SyncWorker` ships events over HTTP to the cloud API; `ReceiveSyncEventsCommand` processes them against the cloud's database.

### Running two real databases locally

1. Bring up the cloud stack, register an org/user via `POST /api/v1/auth/register`.
2. Call `POST /api/v1/sync/nodes` with `{ "name": "..." }`. Returns `nodeId`/`nodeSecret` exactly once.
3. Put those in `.env` as `NODE_ID`/`NODE_SECRET`, then `docker compose up node_postgres local-node`.
4. Create/update a `Product` against the local node's own API (port 8081) and watch it show up in the cloud's `sync_inbox` table once `SyncWorker` picks it up.

## What's still NOT implemented

- Pushing a resolved conflict's outcome back out to the losing side
- Cloud to node sync direction (this phase built node to cloud only)
- The Sync Center UI itself - `GetSyncStatusQuery` provides the data, no frontend consumes it yet
- Conflict review UI showing underlying business events as a human-readable diff
- The local node's own auth is entirely independent of the cloud's - a user created on one side doesn't exist on the other. For a business to actually log in locally *and* in the cloud with the same account, user data itself would need to sync too (it doesn't yet - `User` doesn't implement `ISyncableAggregate`)

## Permissions

| Action | Permission |
|---|---|
| View Sync Center status, resolve conflicts | `system.sync.view` |
| Node event delivery | Node secret header, not a user permission |
