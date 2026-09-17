# Database & Multi-Tenancy

## Tenant isolation mechanism

Every tenant-owned entity derives from `TenantEntity` (`Nexora.Domain.Common`), which carries `OrganizationId` and an optional `BranchId`. `NexoraDbContext.OnModelCreating` walks every entity type at model-build time and attaches a global query filter:

- Types deriving from `TenantEntity` get `DeletedAt == null && (!tenantContext.IsResolved || OrganizationId == tenantContext.OrganizationId)`.
- Everything else deriving from `BaseEntity` (global lookup data) gets just the soft-delete half of that filter.

This is applied once, centrally, rather than per-repository — see `docs/architecture/phase0.md` section 8 and the Phase 0 risk analysis, which rates tenant data leakage as the highest-impact risk in the whole system. `tests/unit/Nexora.UnitTests/Tenancy/TenantIsolationTests.cs` exercises this directly.

To intentionally see across tenants (login lookups, platform-admin tooling, the demo-data seeder), call `.IgnoreQueryFilters()` explicitly at the call site — this is a deliberate, visible escape hatch, not an implicit behavior.

## Soft delete

Nothing is ever hard-deleted. The `AuditableEntitySaveChangesInterceptor` intercepts any tracked `EntityState.Deleted` and converts it to `EntityState.Modified` with `DeletedAt`/`DeletedBy` set instead. Combined with the query filter above, deleted rows simply stop appearing in normal queries while remaining available for audit/recovery.

## Concurrency

Every entity configuration calls `UseXminAsConcurrencyToken()` (an Npgsql-specific EF Core extension), which maps the entity to Postgres's built-in `xmin` system column as the optimistic-concurrency token — no separate `RowVersion` column to maintain by hand. A concurrent update against a stale row throws `DbUpdateConcurrencyException`, which the API's exception-handling middleware currently maps to a generic 500; a dedicated 409 Conflict mapping is a reasonable Phase 2 follow-up once modules start doing more concurrent writes (inventory adjustments especially).

## Auditing

`AuditableEntitySaveChangesInterceptor` writes one `AuditLog` row per tracked insert/update/(soft)delete on every `SaveChanges` call, with JSON before/after snapshots of the entity's values. This is deliberately centralized in the interceptor rather than left to individual module handlers to remember — see spec section 11's requirement that "every important business operation should be auditable." `AuditLog` itself is excluded from being audited (`ExcludedFromAudit`), to avoid an infinite loop of logs about logs.

## Seeding (Development only)

`DbSeeder.SeedAsync` (called from `Program.cs`, guarded by `app.Environment.IsDevelopment()`) does two things, idempotently:

1. Populates the `permissions` table from `Permissions.All()` if any codes are missing.
2. Creates a `demo` organization (slug `demo`) with the full default role set from `docs/authentication.md`, if it doesn't already exist.

This never runs in Production — migrations there are applied explicitly through CI/CD, not implicitly on API boot.

## Adding a new entity

1. Add the entity to `Nexora.Domain`, deriving from `TenantEntity` (business data) or `BaseEntity` (global lookup data).
2. Add an `IEntityTypeConfiguration<T>` in `Nexora.Infrastructure/Persistence/Configurations/`, calling `UseXminAsConcurrencyToken()` like the existing configurations.
3. Expose a `DbSet<T>` on `IApplicationDbContext` and `NexoraDbContext`.
4. Add an EF Core migration: `dotnet ef migrations add <Name> --project Nexora.Infrastructure --startup-project Nexora.Api`.
