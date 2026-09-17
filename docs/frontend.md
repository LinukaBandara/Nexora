# Frontend (`apps/web`)

> **Visual redesign applied:** the palette, sidebar, and shell layout were replaced wholesale with a green/dark-sidebar/floating-panel design adopted from a reference image, per direct user request. See `docs/design/design-system.md`'s redesign note for what changed and why. Because every page/component reads from `styles/tokens.css` rather than hardcoding colors, this propagated automatically to every existing screen (Dashboard, Inventory, Sales) with no per-page edits needed beyond the shell itself and one dashboard KPI-card usage.

## What's real

A working Next.js App Router structure: login → server-side auth gate → shell (sidebar + topbar, permission-filtered nav, path-aware breadcrumb) → four real workspace screens - the executive dashboard, Inventory, Sales customers, and Sales orders - each actually calling their backend queries and rendering whatever comes back, no hardcoded numbers, matching `docs/analytics.md`'s "data must be real" discipline.

**Auth now goes through a real server-side proxy with silent refresh, not a client-readable cookie.** `/api/login` (a Next.js Route Handler) calls the backend, then sets the access and refresh tokens as HttpOnly cookies - the browser sends them automatically but client JavaScript cannot read them, so an XSS bug elsewhere in the app can't exfiltrate a session. Every other API call goes through `/api/proxy/[...path]`, which reads the cookie server-side and attaches it as a Bearer token before forwarding to the real backend. On a 401, the proxy now calls `/api/refresh`'s logic in-process, gets a new token pair (refresh tokens rotate on every use, matching `docs/authentication.md`), retries the original request exactly once, and sets the new cookies on the response - the caller never sees the 401 at all if refresh succeeds. If the refresh token is itself invalid or missing, both cookies are cleared so the next navigation hits `middleware.ts`'s gate and lands on `/login` cleanly instead of looping on a dead session. `middleware.ts` checks for the access-token cookie's presence before any protected page renders.

**What this does NOT do, stated plainly:**
- Refresh is reactive only (triggered by a 401), not proactive - there's no background timer refreshing the token before it expires, so the very first request after expiry always takes the extra refresh round-trip rather than never hitting an expired token at all.
- Middleware only checks that the access-token cookie exists, not that the JWT inside it is validly signed or unexpired - real verification would need a JWT library running in the Edge runtime. This is why the proxy's reactive refresh still matters even with middleware in place: middleware's gate is coarse, the proxy's is the one that actually keeps a session alive across token expiry.
- Only one retry - if the backend rejects the *refreshed* token too (shouldn't happen, but if it did), the proxy returns that failure rather than looping.
- Every proxied request takes an extra hop through the Next.js server instead of going straight to the API, which costs latency - the accepted tradeoff for not exposing the token to the browser.

**Sales now has two screens.** The customer list is a direct pattern replication of Inventory (search, paginate, create) that needed zero new backend work. Sales Orders is new: a status-filtered list (`PendingApproval`/`Approved`/`Invoiced`/all) with a permission-gated **Approve** action - the button only appears if the logged-in user's permissions include `sales.approve` (fetched from `/auth/me`, not assumed), and the backend re-checks that permission independently regardless of what the button shows. This is the first screen that exercises the document-lifecycle status system, not just a read+write list.

The dashboard's revenue trend is a real chart - `LineChart` is a small hand-rolled SVG component rather than a charting library dependency, deliberately: this repo has never had `npm install` run against it, so every new dependency is unverified risk, and a ~60-line chart covering line/hover/empty-state is small enough to trust without running it.

Every visual value (color, spacing, radius, type size) in every component traces back to `styles/tokens.css` via the Tailwind config. Status badges are never color-alone.

## What's NOT real yet

**Never run.** No `npm install`, no `next dev`, no `next build` has been executed - there's no Node.js in this environment. Treat every file here as a careful first draft, same caveat as the backend's "never compiled." The proxy/middleware setup in particular is exactly the kind of thing that tends to have a small typo or Next.js API-shape mismatch on first real run - Route Handlers and middleware conventions shift between Next versions.

**Only four real pages: Dashboard, Inventory, Sales customers, Sales orders** (plus Login). Purchasing, Finance, Sync Center, and Audit Logs are still working nav items pointing at routes with no page built yet - they'll 404. Sales is still missing quotations and invoices screens even though that backend workflow is fully built (`docs/sales.md`).

**No chart library wired in for anything beyond the one dashboard chart.** No bar charts, no donut charts, no multi-series comparison.

**No command palette, no global search, no notification panel UI.** `GET /api/v1/notifications` exists on the backend with nothing consuming it here yet.

## Running it (once Node is available)

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Needs the backend API running at `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8080`).

## Building the next page

Follow the dashboard/orders pages' shape: a typed function in `lib/nexora-api.ts` matching the backend DTO field-for-field (confirm the actual C# record - don't guess), a loading skeleton, an empty state, an error state with retry, components from `components/ui/*` rather than new one-off markup, and a permission check from `/auth/me` if the screen has any gated action. That pattern is what's worth replicating.
