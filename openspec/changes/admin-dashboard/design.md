# Design: Dashboard Admin

## Technical Approach

Desktop-first Dashboard Admin shell, retain the `admin` access boundary, preserve the temporary article tool, add a server-side safe System Health read model. PR1 ships the shell and health; PR2–PR4 reuse the shell. Stitch `projects/13503137979360409383` is reference only. `admin` is the technical role; "Dashboard Admin" and "Admin" are the only user-facing names. Store is MongoDB via Mongoose. No application code changes in this phase.

## Architecture Decisions

| # | Choice | Tradeoff | Decision |
|---|---|---|---|
| 1 | App readiness = route/service capability probe (no PM2, uptime, disk, loopback). | Less informative than process metrics; Next.js cannot observe its own host. | Use the bounded capability probe. |
| 2 | Auth readiness = static provider/session **config** capability (`credentials`, `googleProviderConfigured` if env set, `jwtSessionStrategy`). No real-user session probe. | Cannot detect signing-key drift; health must not depend on or reveal a real user. | Use static config capability. |
| 3 | Health contract: `HealthState = 'ready' | 'degraded' | 'unavailable'`; per-probe `details` is a closed allowlist of booleans. | Less diagnostic detail; raw errors leak secrets. | Use the closed allowlist; tests enforce it. |
| 4 | Each probe wrapped in `Promise.race` (1000 ms default); timeout/throw collapse to `unavailable`. Mongo uses `mongoose.connection.db.admin().ping()` via `connectToDatabase()`. | Small race wrapper; `connectToDatabase()` has no timeout today. | Adopt the 1000 ms race. |
| 5 | Server-only aggregator at `src/lib/admin/health/aggregator.ts` consumed by `/api/admin/health` and `/admin/salud`. | One extra route to maintain. | Adopt; secrets stay off the wire; page/API share tests. |
| 6 | `src/app/admin/layout.tsx` keeps `getServerSession` + `isAdmin` and wraps `children` in `<AdminShell>`. Three temporary tool pages drop duplicate `<AdminNavbar />`. Legacy `admin-navbar.tsx` kept (not deleted) for rollback. | Touches four pages. | Adopt; honors "revert shell/health only, retaining the temporary tool." |
| 7 | Middleware matcher unchanged. PR1 adds no new public route. | None. | Adopt. |

## Data Flow

`/admin/salud` -> layout (`getServerSession` + `isAdmin`) -> `<AdminShell>` (sidebar + header). The page awaits the aggregator (1000 ms race per probe: `application` route/service capability, `mongo` ping, `auth` static config). Result is a `HealthReport` of allowlisted booleans rendered as 3 `<HealthCard>` (ready | degraded | unavailable). `/api/admin/health` returns the same `HealthReport`; identical allowlist, identical tests.

## File Changes (PR1)

Create: `src/lib/admin/health/{types,aggregator,index}.ts`, `src/lib/admin/health/probes/{application,mongo,auth}.ts`, `src/app/api/admin/health/route.ts`, `src/app/admin/salud/page.tsx`, `src/components/admin/{admin-shell,admin-sidebar,admin-header,health-card}.tsx`; tests `admin-shell`, `admin-salud-page`, `admin-health-aggregator`, `admin-health-{application,mongo,auth}-probe`, `api-admin-health`. Modify: `src/app/admin/layout.tsx` (render `<AdminShell>`), `src/app/admin/page.tsx` (drop navbar import, add "Salud del sistema" tile), `src/app/admin/blog/{page,nuevo/page}.tsx` (drop navbar import), `tests/admin-blog-list.test.tsx` (drop unused navbar mock). Untouched: middleware, `src/lib/auth/*`, `connect.ts` (only consumed), legacy `admin-navbar.tsx` (kept for rollback), existing `middleware`/`admin-layout`/`admin-navbar` tests.

## Interfaces / Contracts

`HealthReport` is the single JSON shape for `/api/admin/health` and the only prop shape for `<HealthCard>`. `HealthState = 'ready' | 'degraded' | 'unavailable'`. Each of `application`, `mongo`, `auth` is `{ state, details: Record<string, boolean> }`. `details` is a **closed allowlist**: `application` = `routeImportsResolved`, `adminLayoutResolved`; `mongo` = `pingReachedServer`, `authenticated` (presence of ping, NOT credentials); `auth` = `credentialsProviderConfigured`, `googleProviderConfigured`, `jwtSessionStrategy`. `generatedAt: string` (ISO 8601, no PII). Tests assert no other keys leak.

## Testing Strategy (TDD-first)

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Each probe, the aggregator, the closed-allowlist guard | `admin-health-{application,mongo,auth}-probe.test.ts`, `admin-health-aggregator.test.ts`. RED first. |
| Component | `<AdminShell>`, `<HealthCard>`, `/admin/salud` | `admin-shell.test.tsx`, `admin-salud-page.test.tsx`. Mock `getServerSession` and the aggregator only. |
| API | `/api/admin/health` auth gate + allowlist | `api-admin-health.test.ts`. Assert exact JSON shape, no forbidden keys. |
| Access (regression) | Middleware and `/admin` layout still block non-admin | Existing `middleware.test.ts`, `admin-layout.test.tsx`. |

## Threat Matrix

N/A — PR1 introduces no shell, subprocess, VCS/PR, executable-classification, or process-integration boundary. The two new routes (`/api/admin/health`, `/admin/salud`) are `admin`-gated and covered by the API access tests and existing middleware tests.

## Migration / Rollout

No data migration. No feature flag. Rollback = revert the PR1 commit; legacy `AdminNavbar` imports reappear on the three temporary pages, middleware and layout auth stay intact. Observability: each probe emits one structured `unavailable` log line (state, probe name, elapsed ms) — never values.

## Planned Seams (PR2–PR4)

- **PR2 (Content)**: `src/app/admin/contenido/*` + `src/lib/admin/content/*` reuse `<AdminShell>`. `src/app/admin/blog/*` deleted. New `createDraft`/`publish`/`unpublish` on `src/lib/db/repository/article.ts`; state machine in `src/lib/admin/content/lifecycle.ts`. Public Blog query stays `published: true`.
- **PR3 (Botanical Data)**: `src/app/admin/botanico/*` + `src/lib/admin/botanico/*` reuse `<AdminShell>`. Plant validation alongside `src/lib/db/repository/plant.ts`. Oils/extracts ownership decided before PR3 (lab keeps current ownership until reassigned). `src/lib/jardin-digital/projection.ts` stays the only public path.
- **PR4 (Users)**: `src/app/admin/usuarios/*` + `src/lib/admin/users/*` reuse `<AdminShell>`. Role mutation in `src/lib/admin/users/role-change.ts`; activity in `src/lib/admin/users/activity.ts`. Access-status vocabulary and retention decided before PR4. No raw auth data exposed.

## Open Questions

- [ ] URL: `/admin/salud` vs `/admin/system-health` (design uses `salud` to match existing Spanish URLs).
- [ ] `HealthState` enum approval (`ready`/`degraded`/`unavailable` vs `ok`/`warn`/`down`) and 1000 ms per-probe timeout.
- [ ] Oils/extracts ownership vs laboratorio (deferred to PR3); PR4 activity retention and event vocabulary (deferred to PR4).
