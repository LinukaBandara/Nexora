# NEXORA Design System

> **Redesign note:** the palette and shell layout below were replaced with a
> green/dark-sidebar/floating-panel direction, adopted wholesale from a
> reference design the user provided directly (not derived from the
> original spec's blue enterprise palette in sections 4/28 of the earlier
> UI briefs). The token file (`apps/web/styles/tokens.css`) is the
> up-to-date source of truth; this doc's Color/Layout sections below are
> updated to match it. Everything else on this page (typography scale,
> component inventory, data-table rules, motion, the "done" checklist)
> is unaffected by the redesign and still applies as written.

Source: the full UI/UX spec (frontend design brief). This doc is the condensed, enforceable version — what to check a screen against, not the full rationale. Tokens live in code: `apps/web/styles/tokens.css` (raw values) and `apps/web/tailwind.config.js` (Tailwind mapping).

## The one-line test

> Does this look like an actual commercial ERP a manager could use for 8 hours without getting annoyed?

If a screen fails that, it doesn't matter which individual rule broke — redesign it.

## Personality → decisions

| Personality trait | What it means in practice |
|---|---|
| Precise | Numbers right-aligned, consistently formatted (`Rs. 1,250,000.00`), monospaced tabular figures where lists of numbers are compared |
| Intelligent | The UI surfaces what needs attention (low stock, overdue invoices, sync conflicts) rather than making the user hunt for it |
| Controlled | One obvious primary action per screen (spec section 18) — never five equally-weighted buttons |
| Premium | Achieved through typography/spacing/alignment — never through gradients, glow, or oversized cards (spec section 95) |
| Operational | Every screen answers: where am I, what am I looking at, what can I do, what needs attention, what happens next (spec section 93) |

## Color discipline

Primary is now green (`--color-primary: #22C55E`), not the original spec's blue — a deliberate user-directed change, applied via tokens so it propagates everywhere rather than being patched per-component. The sidebar runs its own dark palette (`--color-sidebar-*`) independent of the light content panel's palette; a component rendered inside the sidebar should use `sidebar-*` Tailwind classes (`bg-sidebar-bg`, `text-sidebar-text`), never the light-panel `text-primary`/`bg-surface` tokens, or it will look wrong against the dark background.

Status color is never the only signal — every `StatusBadge` pairs a color with a dot and a text label, so the app stays usable for colorblind users and still makes sense in a screenshot with no color at all.

## Typography

Geist, falling back to Inter. Scale is in `tokens.css` (`--font-size-*`). Headings 600–700 weight, labels 500–600, body 400.

## Spacing & radius

4px base scale (`--space-1` … `--space-16`), unchanged by the redesign. Radius is now much larger than the original spec's restrained-enterprise system — `--radius-card: 20px`, `--radius-container: 32px`, and `--radius-button: 999px` (a full pill, not a rounded rectangle) — matching the reference design's softer, rounder look. This is a deliberate, explicit reversal of the earlier design system's "never 24–32px corners" rule; that rule applied to the old direction, not this one.

## Layout shell

- Desktop: the sidebar and main content live inside one shared rounded container (`--radius-container`) that floats on a green gradient page background (`--color-page-gradient-*`), with `overflow-hidden` clipping both the dark sidebar corner and the light content corner to the same outer radius. See `app/(shell)/layout.tsx`.
- Sidebar (`--sidebar-width-expanded` 240px): dark background, flat nav list (no section group labels), active item is a solid green pill rather than a subtle left-border indicator.
- Top bar (`--topbar-height` 64px): page title on the left, notification bell and avatar on the right — deliberately minimal, no breadcrumb slash-notation or sync-status decoration (see `Topbar.tsx`).
- Mobile layout for this new shell hasn't been redesigned yet — the floating-panel-on-gradient concept doesn't obviously translate to a small screen, and needs its own pass rather than just shrinking the desktop version.

## Component inventory

**Primitives** (build once, reuse everywhere — spec section 86): Button, Input, Select, Combobox, Checkbox, Radio, Switch, Badge, Tooltip, Dropdown, Popover, Dialog, Drawer, Tabs, Card, Table, Pagination, Breadcrumb, Command, Toast, Alert, Skeleton, Avatar, Date Picker, Chart.

**Business components** (compose the primitives): KpiCard, StatusBadge, MoneyDisplay, SyncIndicator, SyncEvent, ActivityTimeline, ProductTable, CustomerSummary, InvoiceSummary.

A button, badge, or table must be **pixel-identical** whether it appears in Inventory or Finance — component consistency is spec section 87, not a suggestion.

## Data tables (the module the spec spends the most words on)

Every business-data table needs: sorting, filtering, pagination, column visibility, row selection where bulk actions make sense, search, loading (skeleton, not spinner) and empty states. Numbers right-aligned. Status as badges. Row actions present but not dominant — the data is the point, not the buttons next to it.

## Motion

150–250ms, used for: sidebar transitions, drawer slides, modal fades, button feedback, table hover, dropdown transitions, skeleton loading, the sync indicator. Never bouncing, parallax, or dramatic page transitions (spec section 72).

## What "done" looks like for a screen

Before calling any screen finished, check it against spec section 96 verbatim:
- Does this look like an actual commercial ERP?
- Could a manager use this for 8 hours without getting annoyed?
- Can I find the important information immediately?
- Is the primary action obvious?
- Are numbers aligned and readable?
- Does the UI work with large datasets (server-side pagination, not client-side array filtering on 100k rows)?
- Does the screen still make sense offline (sync indicator, not a full-screen error)?
- Is it consistent with the rest of NEXORA?
- Does anything look obviously AI-generated?

## Build order (spec section 97)

Design language first, screens second. Order: tokens → component system → desktop shell → mobile shell → Dashboard → Inventory (Overview, Product list, Product detail) → Sales (Overview, Sales Order) → Purchasing Overview → Finance Overview → Employee Overview → Analytics → Sync Center → Audit Logs → Settings.

This repo currently has: tokens + Tailwind mapping (done, this commit) and a shell + dashboard mockup (see chat — not yet committed as code, since `apps/web` isn't scaffolded as a real Next.js app yet). Everything below "Dashboard" in the build order is still ahead.
