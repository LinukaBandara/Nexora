# Local Development

## Prerequisites

- .NET 10 SDK
- Docker (for Postgres/Redis/RabbitMQ, and for integration tests via Testcontainers)
- (Later phases) Node.js 22+ for `apps/web`

## First-time setup

```bash
cp .env.example .env
# Fill in:
#   POSTGRES_PASSWORD
#   RABBITMQ_PASSWORD
#   JWT_SIGNING_KEY   (openssl rand -base64 32)

docker compose -f infrastructure/docker/docker-compose.yml up --build
```

On first Development-environment boot, the API applies pending EF Core migrations and runs `DbSeeder` (permission catalog + demo organization) automatically — see `docs/database.md`.

## Everyday workflow

```bash
# Backend only, without Docker (point ConnectionStrings:Default at a local Postgres):
cd backend
dotnet watch run --project Nexora.Api

# Format & lint before committing (also runs in CI):
dotnet format backend/Nexora.sln

# Add a migration after changing an entity:
dotnet ef migrations add <Name> --project backend/Nexora.Infrastructure --startup-project backend/Nexora.Api
```

## Testing

```bash
# Fast, no external dependencies (EF Core InMemory provider):
dotnet test tests/unit/Nexora.UnitTests/Nexora.UnitTests.csproj

# Spins up a real disposable Postgres container via Testcontainers - needs Docker running:
dotnet test tests/integration/Nexora.IntegrationTests/Nexora.IntegrationTests.csproj
```

Every pull request runs both suites in CI (`.github/workflows/ci.yml`), plus a format check and a NuGet vulnerability scan.

## Running a local node

`Nexora.LocalNode.Api` is a second, genuinely separate deployable with its own database - see `docs/sync.md` for the full walkthrough (register a node against the cloud API, then `docker compose up node_postgres local-node`). Useful for actually exercising the sync protocol against two real databases rather than reasoning about it in the abstract.

## Conventions

- **Vertical slices, not horizontal layers-first.** When adding a new module (Inventory, Sales, ...), build it end-to-end — entity → EF configuration → Application command/query → controller → tests — before moving to the next module. See spec section 49, Rule 1.
- **Never bypass `[HasPermission(...)]`.** If a new endpoint doesn't have an obvious permission yet, add one to `Permissions` rather than leaving the endpoint unguarded.
- **Domain events for cross-module reactions**, not direct repository calls between modules. If Sales needs to react to something in Inventory, it subscribes to a domain event rather than calling into Inventory's repositories directly.
- **Nothing hard-deletes.** Removing something means setting `DeletedAt` — the interceptor does this automatically for anything going through EF Core's normal `Remove()`.
