# NEXORA ERP — Phase 0: Architecture Proposal

**One Business. One System. Total Control.**

This document is the Phase 0 deliverable requested before implementation begins: architecture, database design, module map, sync strategy, UI IA, design system, MVP scope, roadmap, and risk analysis. No implementation code is included — this is for review and approval first.

---

## 1. Final Architecture Proposal

NEXORA is built as a **modular monolith** with clean module boundaries, not microservices. Each business domain (Inventory, Sales, Purchasing, Finance, HR, Sync) lives in its own vertical slice inside the Application layer, sharing one deployable API. This keeps operational complexity low while leaving a clean extraction path if any module later needs to become its own service.

Two deployable backend targets share the same codebase:

- **Nexora.Api** — the cloud-hosted multi-tenant API.
- **Nexora.LocalNode** — a slimmed-down, single-tenant build of the same Application/Domain layers, packaged to run on a business's own machine/server, backed by a local PostgreSQL instance, with the Sync module active instead of dormant.

This "one codebase, two deployment shapes" approach avoids maintaining a second implementation of business logic for on-premise customers.

---

## 2. System Architecture Diagram

```
                                   ┌─────────────────────┐
                                   │      NEXORA WEB      │
                                   │  Next.js / React/TS  │
                                   └──────────┬───────────┘
                                              │ HTTPS
                                   ┌──────────▼───────────┐
                                   │   ASP.NET CORE API    │
                                   │  (Nexora.Api)          │
                                   └──────────┬───────────┘
                        ┌──────────────────────┼──────────────────────┐
                        │                      │                      │
               ┌────────▼────────┐   ┌─────────▼────────┐   ┌─────────▼────────┐
               │   APPLICATION    │   │      DOMAIN       │   │  INFRASTRUCTURE  │
               │ (use cases, CQRS │   │ (entities, value   │   │ (EF Core, Redis, │
               │  handlers, DTOs) │   │  objects, rules)   │   │  RabbitMQ, auth)  │
               └──────────────────┘   └────────────────────┘   └──────────┬────────┘
                                                                          │
                                                     ┌────────────────────┼────────────────────┐
                                                     │                    │                    │
                                              ┌──────▼─────┐      ┌───────▼──────┐     ┌────────▼───────┐
                                              │ PostgreSQL  │      │    Redis      │     │   RabbitMQ      │
                                              │ (tenant data)│     │ (cache/session)│     │ (events/outbox) │
                                              └─────────────┘      └───────────────┘     └────────────────┘


                         ┌───────────────────────────────────────────────┐
                         │                NEXORA CLOUD                    │
                         │              Secure Sync API                   │
                         └───────────────────┬────────────┬──────────────┘
                                              │            │
                         ┌────────────────────▼─┐        ┌─▼────────────────────┐
                         │  NEXORA NODE (Biz A)   │        │  NEXORA NODE (Biz B)  │
                         │  Local API + Postgres   │        │  Local API + Postgres │
                         │  Sync Worker + Outbox   │        │  Sync Worker + Outbox │
                         └────────────────────────┘        └───────────────────────┘
```

---

## 3. Module Architecture

Backend modules (each a vertical slice with its own folder under `Nexora.Application/Modules/`):

| Module | Owns | Depends on |
|---|---|---|
| Identity | Users, roles, permissions, auth, tenants, branches | — |
| Inventory | Products, warehouses, stock, movements | Identity |
| Sales | Customers, quotations, orders, invoices, payments | Inventory, Identity |
| Purchasing | Suppliers, purchase orders, goods receipts | Inventory, Identity |
| Finance | Accounts, income, expenses, receivables, payables | Sales, Purchasing |
| HR | Employees, attendance, leave, payroll | Identity |
| Audit | Audit log capture (cross-cutting, subscribes to domain events) | all |
| Sync | Outbox, inbox, conflict detection, node registration | all (event consumer only) |
| Analytics | Read-only aggregation/reporting across modules | all (read-only) |

Modules communicate internally through **domain events**, not direct cross-module repository calls, except for well-defined read-only query interfaces (e.g., Sales reading Inventory stock availability). This keeps boundaries honest and makes future extraction realistic.

---

## 4. Database ERD (entity-relationship summary)

Full DDL comes in Phase 1; this is the relationship map.

```
organizations 1─┬─* branches
                ├─* users ──* user_roles *── roles ──* role_permissions *── permissions
                ├─* organization_settings
                │
                ├─* products ──* product_categories
                │      │
                │      └─* inventory (product+warehouse) ──* stock_movements
                │
                ├─* warehouses ──* warehouse_locations
                │
                ├─* customers ──* customer_addresses
                │      └─* quotations ─▶ sales_orders ─▶ invoices ──* invoice_items
                │                                            └──* payments
                │
                ├─* suppliers ──* purchase_orders ──* purchase_order_items
                │                        └─▶ goods_receipts ──* goods_receipt_items
                │                                └─▶ supplier_invoices
                │
                ├─* accounts ──* journal_entries ──* journal_entry_lines
                │      ├─* expenses / income
                │      └─* receivables / payables
                │
                ├─* employees ──* attendance / leave_requests
                │      └─* payroll_runs ──* payroll_items
                │
                ├─* audit_logs
                ├─* notifications
                │
                └─* sync_outbox / sync_inbox / sync_events / sync_conflicts
                       └─* sync_checkpoints ── node_registrations
```

Every business table (products, customers, invoices, etc.) carries `organization_id` (tenant key), `branch_id` where relevant, `created_at`, `updated_at`, `created_by`, soft-delete flag (`deleted_at`), and a `row_version`/`xmin`-based concurrency token. Sync-relevant tables additionally carry `aggregate_id`, `version`, and `source_node_id`.

---

## 5. Folder Structure

```
nexora/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── local-node/          # local-node packaging/installer scripts
├── backend/
│   ├── Nexora.Domain/        # entities, value objects, domain events, invariants
│   ├── Nexora.Application/   # use cases per module, CQRS handlers, validators
│   ├── Nexora.Infrastructure/# EF Core, Postgres, Redis, RabbitMQ, auth providers
│   ├── Nexora.Api/           # cloud API host, controllers/minimal APIs, DI wiring
│   └── Nexora.LocalNode.Api/ # local-node host (reuses Domain/Application/Infra)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── infrastructure/
│   ├── docker/
│   ├── deployment/
│   └── ci/
├── docs/
│   ├── architecture/  ├── api/  ├── database/  └── deployment/
└── README.md
```

---

## 6. API Architecture

- **REST over HTTPS**, versioned (`/api/v1/...`), organized by module (`/api/v1/inventory/products`, `/api/v1/sales/orders`, ...).
- **CQRS-flavored** internally (Application layer splits commands/queries) but exposed as conventional REST resources — no need to expose CQRS to the frontend.
- **Consistent envelope** for errors: `{ message, correlationId, errors?: [...] }`, never a raw 500 to the client.
- **Pagination, filtering, sorting** via query parameters, standardized across all list endpoints.
- **Idempotency-Key header** required on all state-mutating sync-relevant endpoints (invoice creation, payment recording, stock adjustment) to make retries safe.
- Internal **Sync API** is a separate, narrower surface (`/api/v1/sync/...`) used only by node↔cloud communication, authenticated via node credentials rather than user JWTs.

---

## 7. Authentication / Authorization Strategy

**Authentication**
- ASP.NET Core Identity for credential storage and password hashing, customized for multi-tenant lookup (email is unique per-organization, not globally).
- Short-lived JWT access tokens + rotating refresh tokens (stored hashed, revocable).
- Lockout after repeated failed attempts; MFA fields present in the schema from day one (TOTP secret, enabled flag) even though MFA UI ships later.
- Local node authenticates to the cloud Sync API using a separate **node credential** (client-credentials style), independent of any individual user's session.

**Authorization**
- RBAC with the default roles listed in the spec, backed by granular permission strings (`inventory.read`, `sales.approve`, etc.).
- Permissions are checked **only in the Application layer / API**, via policy-based authorization — the frontend hides UI for convenience but every command handler re-checks permissions independently. This is enforced as a hard rule, not a suggestion.
- Tenant resolution happens once, early in the pipeline (middleware resolves `organization_id` from the JWT claim), and every repository query is automatically scoped by it — never left to individual handlers to remember.

---

## 8. Hybrid Synchronization Design

**Model:** event/outbox-based, not database replication.

```
Local write ─▶ Local DB transaction (business row + outbox row, same transaction)
                          │
                          ▼
                  Sync Worker (background)
                          │  batches, signs, retries w/ exponential backoff
                          ▼
                  Cloud Sync API  ── validates idempotency key + version ──▶ applies event
                          │
                          ▼
                  Ack written back to local sync_checkpoints
```

- Every outbox event carries: `event_id`, `aggregate_id`, `aggregate_type`, `version`, `idempotency_key`, `occurred_at`, `source_node_id`, `payload`.
- Cloud API rejects/dedupes on `idempotency_key`; version mismatches are written to `sync_conflicts` instead of overwritten silently.
- **Conflict policy is entity-specific**, not global:
  - Inventory stock: never sync a final number — sync the **stock movement events** themselves, so cloud replays movements rather than trusting a snapshot. This makes most "conflicts" resolve automatically (two movements just both apply).
  - Master data (product name, price): last-write-wins by version, with the losing write logged to `sync_conflicts` for manual review.
  - Financial documents (invoices, payments): never auto-resolved — always routed to `sync_conflicts` for a human decision, since silently picking a side is unacceptable for money.
- Offline behavior: the local node's Application/Domain layers don't know or care whether the internet is up. The outbox simply grows; the Sync Worker is the only component aware of connectivity.

---

## 9. UI Information Architecture

```
Login → Executive Dashboard (home)
├── Sales        → Overview / Orders / Order Detail / Customers / Customer Detail / Invoices / Payments
├── Inventory     → Overview / Products / Product Detail / Warehouses / Movements / Transfers / Adjustments
├── Purchasing    → Overview / Suppliers / Purchase Orders / PO Detail / Goods Receiving
├── Finance       → Overview / Transactions / Income / Expenses / Receivables / Payables
├── HR            → Employees / Employee Detail / Departments / Attendance / Leave / Payroll
├── Analytics     → Sales / Inventory / Finance / Reports
└── System        → Users / Roles / Permissions / Org Settings / Notifications / Audit Logs / Sync Center
```

Global elements present on every screen: Command Palette (Ctrl/Cmd+K), Sync status indicator in the top bar, Notification Center, Breadcrumbs.

---

## 10. Design System (tokens)

| Token | Value |
|---|---|
| Deep Slate (text/nav) | `#111827` |
| Background | `#F7F8FA` |
| Surface | `#FFFFFF` |
| Primary Accent | `#2563EB` |
| Success | `#16A34A` |
| Warning | `#D97706` |
| Danger | `#DC2626` |
| Dark Background | `#0B0F14` |

- Typography: Inter or Geist, strong hierarchy, restrained sizes (enterprise density over decorative scale).
- Spacing/radius: a small consistent scale (e.g., 4/8/12/16/24/32px; radius 6–8px) — no oversized rounded cards.
- Components built once in a shared library (DataTable, StatCard, Drawer, Modal, CommandPalette, FilterBar, StatusBadge, EmptyState, Skeleton, ActivityFeed, ChartCard, SyncIndicator, ConfirmDialog) and reused everywhere — no per-page one-offs.
- Motion: subtle, functional only (loading, transitions) — no decorative animation.

---

## 11. MVP Scope

**In:** Auth + multi-tenancy + RBAC + audit logs · Inventory (products, categories, warehouses, stock, movements) · Sales (customers, orders, invoices, payments) · Purchasing (suppliers, POs, goods receiving) · Finance core (income, expenses, receivables, payables, dashboard) · Hybrid sync (local node, outbox, worker, cloud endpoint, idempotency, retries, conflict detection, Sync Center) · Analytics (dashboard + sales/inventory/basic financial reports).

**Out (explicitly deferred):** manufacturing MRP, full tax engine, double-entry accounting, native mobile apps, marketplace, AI chatbot, complex CRM, broad third-party integrations, microservices.

---

## 12. Development Roadmap

| Phase | Deliverable |
|---|---|
| 0 | This document — architecture, ERD, roadmap (**current**) |
| 1 | Foundation: repo, auth, multi-tenancy, RBAC, audit logs, Docker, CI |
| 2 | Inventory vertical slice, end to end |
| 3 | Sales vertical slice, end to end |
| 4 | Purchasing vertical slice, end to end |
| 5 | Finance core |
| 6 | Hybrid Sync (local node, outbox, worker, conflict detection, Sync Center) |
| 7 | Analytics |
| 8 | HR & Payroll |
| 9 | Production hardening (security, performance, accessibility, tenant-isolation and sync testing) |

Each phase is built **vertically** (DB → backend → validation → auth → frontend → error handling → tests) rather than horizontally across all modules at once.

---

## 13. Risk Analysis

| Risk | Impact | Mitigation |
|---|---|---|
| Sync conflict logic underestimated | High — silent data loss/corruption | Entity-specific conflict rules from day one; financial docs never auto-resolve; dedicated sync test suite |
| Tenant data leakage | Critical | Single enforced tenant-resolution middleware; isolation tests as a required CI gate, not optional |
| Scope creep into full accounting/MRP | Medium — MVP delay | Explicit "not MVP" list enforced at planning, not just documented |
| Local node drift from cloud codebase | Medium — two implementations to maintain | Shared Domain/Application layers between `Nexora.Api` and `Nexora.LocalNode.Api`; only Infrastructure/hosting differs |
| .NET 10 / bleeding-edge stack maturity | Low–Medium | Pin versions early, track LTS status, avoid preview packages in production paths |
| Solo/small-team build vs. spec size | High — this is an enterprise-scale spec | Strict phase discipline (Section 53); do not start Phase 2 before Phase 1 is genuinely done |

---

## 14. Recommended Deployment Architecture

```
Cloudflare → Vercel (Next.js) → ASP.NET Core API → PostgreSQL / Redis / RabbitMQ   (cloud)
On-premise: Docker Compose bundle (API + Postgres + Sync Worker) on customer hardware/VM  (local node)
```

- Cloud: containerized API behind Cloudflare/Vercel, managed Postgres (with room for read replicas later), Redis for cache/session, RabbitMQ for the sync/event pipeline.
- On-premise: a single Docker Compose bundle a business can install locally, exposing the same API surface, with its own Postgres and a Sync Worker container that talks outbound-only to the cloud Sync API (avoids requiring inbound firewall rules at the customer site).
- All environments driven by env vars, `.env.example` provided, no secrets committed, CI runs build/test/lint/type-check/security scan on every PR.

---

This is the proposal — no implementation code has been written yet, per the build rules. Next step, on your approval, is Phase 1 (Foundation): repository scaffold, auth, multi-tenancy, RBAC, audit logs, Docker, and CI.
