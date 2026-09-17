# Authentication & Authorization

## Authentication flow

1. `POST /api/v1/auth/register` — creates a new Organization, a Head Office branch, an `Organization Admin` role granted every permission, and the first user. Returns an access token + refresh token immediately (no separate email-verification gate in Phase 1 — `EmailConfirmed` exists on `User` for when that's added).
2. `POST /api/v1/auth/login` — validates credentials, resets the failed-attempt counter on success, issues a new access/refresh token pair.
3. `POST /api/v1/auth/refresh` — rotates the refresh token: the old one is revoked and linked to its replacement via `ReplacedByTokenId`. Presenting an already-revoked token revokes **every** active token for that user, on the assumption a revoked token being reused means it leaked.
4. `GET /api/v1/auth/me` — returns identity + the permission list, which the frontend uses to decide what to render. This is a convenience for the UI only; it is never the source of truth for authorization.

Access tokens are short-lived (15 minutes by default, `Jwt:AccessTokenMinutes`). Refresh tokens last 30 days and are stored **hashed** (`RefreshToken.TokenHash`) — the raw value is returned to the client exactly once, at issuance.

## Account lockout

Five consecutive failed login attempts locks the account for 15 minutes (`LoginCommandHandler.MaxFailedAttempts` / `LockoutDuration`). The lockout state (`LockoutEnd`, `AccessFailedCount`) lives directly on `User` rather than a separate table — simple enough for Phase 1, revisit if rate-limiting needs to move to Redis under real load.

Login failures for both "no such user" and "wrong password" return the identical message, `Invalid email or password.` — never reveal which one it was.

## RBAC

Permissions are global strings (`inventory.read`, `sales.approve`, ...) defined once in `Nexora.Application.Common.Security.Permissions`. Roles are per-organization and grant a set of permissions; a user can hold multiple roles. The seeded default roles (`DbSeeder.DefaultRoleModules`) mirror spec section 10:

| Role | Default access |
|---|---|
| Organization Admin | every permission (seeded at registration) |
| Manager | full access across inventory, sales, purchasing, finance, hr |
| HR / Finance / Inventory / Sales Manager | full access within their one module |
| Employee | read-only across every module |

**Enforcement happens exclusively server-side.** Each permission code gets a matching ASP.NET Core authorization policy (registered in a loop over `Permissions.All()` in `Program.cs`), and controller actions declare `[HasPermission(Permissions.Sales.Approve)]`. The frontend hiding a button is a UX convenience, never a security boundary — a request that reaches the API without the right permission claim on its access token is rejected regardless of what the UI would have shown.

## Tenant resolution

`TenantResolutionMiddleware` runs once per authenticated request, right after `UseAuthentication()` and before `UseAuthorization()`/`MapControllers()`. It reads `org_id`/`branch_id` claims from the validated JWT and sets them on the request-scoped `ITenantContext`. `NexoraDbContext`'s global query filters read that context for every query against any `TenantEntity` — individual repositories or handlers never re-derive or re-check the tenant themselves.

Unauthenticated endpoints (`register`, `login`, `refresh`, health checks) have no tenant context resolved; queries that must run before a tenant is known (looking a user up by email at login) use `.IgnoreQueryFilters()` explicitly, rather than relying on the implicit fallback.
