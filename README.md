# NEXORA ERP

**One Business. One System. Total Control.**

NEXORA is a hybrid ERP platform: cloud flexibility, on-premise control, and secure offline-capable synchronization between the two. Full architecture proposal: [`docs/architecture/phase0.md`](docs/architecture/phase0.md).

This repository currently contains **Phases 1-6**: authentication, multi-tenancy, RBAC, audit logging, stock-ledger-based inventory, the full sales and purchasing workflows, an MVP finance core, and the core mechanics of Hybrid Sync.

## What's implemented so far

**Foundation**
- Multi-tenant data model (`Organization → Branch → Users/roles/business data`) with automatic tenant isolation via EF Core global query filters
- JWT authentication with rotating refresh tokens, reuse detection, and account lockout
- RBAC: default roles backed by granular permission strings, enforced server-side — never by hiding UI
- Automatic audit logging of every tracked insert/update/delete
- Consistent, friendly API error envelope; health checks; Dockerized stack; CI

**Inventory** (see [`docs/inventory.md`](docs/inventory.md)) — products, warehouses, an append-only `StockMovement` ledger that stock levels are always derived from, never edited directly. Stock can never go negative.

**Sales** (see [`docs/sales.md`](docs/sales.md)) — Quotation → Sales Order → Invoice (partial invoicing supported) → Payment, wired into Inventory at invoicing.

**Purchasing** (see [`docs/purchasing.md`](docs/purchasing.md)) — Purchase Order → Goods Receipt (partial/split receiving supported) → Supplier Invoice, the mirror image of Sales, wired into Inventory at receiving.

**Finance** (see [`docs/finance.md`](docs/finance.md)) — accounts, income, expenses, a financial summary that computes receivables/payables live, and receivables/payables aging (`Current`/`1-30`/`31-60`/`61-90`/`90+`).

**Hybrid Sync** (see [`docs/sync.md`](docs/sync.md)) — automatic outbox capture on every business-entity change, an idempotent/versioned receiving protocol with a real per-entity-type conflict policy (append-only types never conflict, financial documents never auto-resolve, master data resolves last-write-wins with full traceability), and a background worker with retry/backoff. `Nexora.LocalNode.Api` is now a genuinely separate deployable with its own database (`docker-compose` runs two real Postgres instances) — node registration, outbox shipping, and cloud-side receiving all run against two actually-separate databases, not one pretending to be two. Still open: pushing a resolved conflict back to the losing side, cloud→node sync direction, and user accounts don't sync between node and cloud yet.

**Analytics** (see [`docs/analytics.md`](docs/analytics.md)) — executive dashboard (revenue, orders, inventory value, receivables, top products, low-stock alerts, recent activity from the audit log), plus Sales and Inventory drill-down analytics. Reads live from each module's own tables rather than a separate reporting layer.

**Document immutability** (see [`docs/document-lifecycle.md`](docs/document-lifecycle.md)) — a finalized invoice, sales order, purchase order, or supplier invoice can no longer be silently modified; enforced by a `SaveChanges` interceptor, not convention.

**Notifications** (see [`docs/notifications.md`](docs/notifications.md)) — a real notification table with genuine trigger points (payment received, low stock, sync conflicts needing human review), not just an unused schema.

**Frontend** (see [`docs/frontend.md`](docs/frontend.md)) — `apps/web` is a real Next.js app with four working screens (Dashboard, Inventory, Sales customers, Sales orders) and a complete token lifecycle: `/api/login` + `/api/proxy` keep tokens in HttpOnly cookies the browser can send but client JS can't read, `middleware.ts` gates protected routes server-side, and the proxy now silently refreshes an expired access token on a 401 and retries once before the caller ever sees a failure — the refresh-token cookie added last turn was sitting unused until this closed the loop. The Sales Orders screen is permission-gated (an Approve action that only appears if the user's actual permissions include `sales.approve`). Still open: refresh is reactive-only (no proactive background refresh), and most sidebar links are still real navigation to pages that don't exist.

## Not yet built

HR & Payroll, production hardening, the AI copilot ("NEXORA Intelligence"), the chart system, and most of the frontend's screens (see the roadmap in the Phase 0 doc and the gaps listed in `docs/frontend.md`).

## Running locally

```bash
cp .env.example .env
# fill in POSTGRES_PASSWORD, RABBITMQ_PASSWORD, and JWT_SIGNING_KEY (openssl rand -base64 32)

docker compose -f infrastructure/docker/docker-compose.yml up --build
```

The API comes up on `http://localhost:8080`, with Swagger UI at `/swagger` in Development. On first Development startup it runs pending EF Core migrations and seeds the permission catalog plus a demo organization (`docs/database.md` has the full seeding notes).

To run without Docker:

```bash
cd backend
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=nexora;Username=nexora;Password=..." --project Nexora.Api
dotnet user-secrets set "Jwt:SigningKey" "$(openssl rand -base64 32)" --project Nexora.Api
dotnet run --project Nexora.Api
```

## Running tests

```bash
dotnet test tests/unit/Nexora.UnitTests/Nexora.UnitTests.csproj
dotnet test tests/integration/Nexora.IntegrationTests/Nexora.IntegrationTests.csproj   # needs a local Docker daemon (Testcontainers)
```

> **Note on this scaffold:** it was hand-written in an environment without the .NET SDK available, so it has not been compiled or run. Treat it as a careful first draft — run `dotnet build` and the test suite as your first step, and expect to fix the inevitable small issues (NuGet package version pins in particular tend to drift) before building on top of it.

## Repository structure

See [`docs/architecture/phase0.md`](docs/architecture/phase0.md) section 5 for the full folder-structure rationale.

```
nexora/
├── backend/            # .NET solution: Domain, Application, Infrastructure, Api
├── apps/web/            # Next.js frontend (not yet scaffolded)
├── tests/               # unit, integration, e2e
├── infrastructure/docker/
├── docs/
└── .github/workflows/
```

## Documentation

- [Architecture / Phase 0 proposal](docs/architecture/phase0.md)
- [Authentication & authorization](docs/authentication.md)
- [Database & multi-tenancy](docs/database.md)
- [Inventory module](docs/inventory.md)
- [Sales module](docs/sales.md)
- [Purchasing module](docs/purchasing.md)
- [Finance module](docs/finance.md)
- [Document lifecycle & immutability](docs/document-lifecycle.md)
- [Notifications](docs/notifications.md)
- [Hybrid Sync module](docs/sync.md)
- [Design system](docs/design/design-system.md)
- [Frontend (apps/web)](docs/frontend.md)
- [Local development](docs/development.md)
