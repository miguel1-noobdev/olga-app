# Apply Progress: Dashboard Admin

## Status

PR1 tasks 1.1–1.7 and PR2 tasks 2.1–2.3 are complete in Strict TDD mode. PR2 is the second slice of the user-approved feature-branch chain and is based on PR1; PR3–PR4 were not started.

## PR4 Follow-up: Persisted Account Middleware Gate

- Scope: revalidate the current persisted account status and role for `/blog`, `/jardin-digital`, `/laboratorio`, and `/admin` after JWT decoding.
- RED: `tests/middleware.test.ts` failed for suspended JWT access across all four routes, a missing/unavailable account, and a stale elevated JWT role.
- GREEN: middleware uses an internal server-side account check, fails closed to `/` for missing, suspended, malformed, or unavailable account reads, and applies staff boundaries to the persisted role rather than the JWT claim.
- Verification: `npm run test:run -- tests/middleware.test.ts` — 25 tests passed; `npx tsc --noEmit` — passed.
- Non-goals: content, botanical catalog, lots, UI, commits, pushes, and review lifecycle.

## Approved Decisions

- Application readiness is the bounded route/service capability signal only.
- Authentication readiness is a non-identifying static credentials-provider, Google-configuration, and JWT-session capability signal.
- MongoDB uses the existing Mongoose connection and an `admin().ping()` probe, bounded to 1000 ms.
- The only states are `ready`, `degraded`, and `unavailable`; output details use the closed boolean allowlists in `HealthReport`.

## Completed Tasks

- [x] 1.1 Gate: approved signals and 1000 ms bound.
- [x] 1.2 RED: probe and aggregator safe-output tests.
- [x] 1.3 GREEN: server-only health read model and probes.
- [x] 1.4 REFACTOR: centralized bounded fallback and value-free unavailable logging.
- [x] 1.5 RED: shell, health page, and protected API tests.
- [x] 1.6 GREEN/REFACTOR: shared Admin shell, health page/API, and retained article tooling.
- [x] 1.7 Regression: middleware and server-layout access checks.
- [x] 2.1 RED: lifecycle, private-draft intake, private preview, and public-denial tests.
- [x] 2.2 GREEN/REFACTOR: lifecycle state machine, MongoDB repository lifecycle methods, Admin content routes, preview/actions, and temporary-tool removal.
- [x] 2.3 Regression: subscriber public Blog remains filtered to published records and Admin routes remain protected.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | N/A — approval gate | N/A | N/A | N/A — user-approved boundary | N/A | N/A | N/A |
| 1.2 | `tests/admin-health-{aggregator,auth-probe,mongo-probe}.test.ts` | Unit | N/A (new files) | Failed before production modules existed: 6 suites unresolved | Passed: 6 files, 11 tests | Ready and failure/timeout paths | Central allowlisted fallback |
| 1.3 | Same as 1.2 | Unit | N/A (new files) | Tests existed before health production code | Passed: 6 files, 11 tests | Mongo ping and timeout; auth configured/unconfigured | Server-only exported read model |
| 1.4 | `tests/admin-health-bounds.test.ts` | Unit | 11/11 new health tests | Failed: unavailable throw emitted no value-free log | Passed: 1 file, 1 test | Throw path complements timeout path | Extracted `logUnavailableProbe`; tests remained green |
| 1.5 | `tests/admin-shell.test.tsx`, `tests/admin-salud-page.test.tsx`, `tests/api-admin-health.test.ts` | Integration | N/A (new files) | Failed before shell, page, and route existed: 3 suites unresolved | Passed: 3 files, 5 tests | Anonymous/non-Admin/Admin API and ready/unavailable cards | Shared health contract props |
| 1.6 | Same as 1.5 plus `tests/admin-blog-list.test.tsx` | Integration | 24/24 existing Admin/access tests before editing | Tests existed before shell route/page code | Passed: 40 focused tests | Shell navigation, retained article tool, and three-card page | Removed obsolete page-level navbar mock; legacy component retained |
| 1.7 | `tests/middleware.test.ts`, `tests/admin-layout.test.tsx` | Integration | 24/24 before editing | Existing access regression suite | Passed: 23 access tests within final 40-test run | Anonymous, non-Admin, productora, and Admin paths | No access-code refactor needed |
| 2.1 | `tests/admin-content-lifecycle.test.ts`, `tests/article-repository.test.ts` | Unit/Integration | 20/20 existing article/Admin tests | Failed: lifecycle module unresolved; intake test expected draft but current repository published it | Passed: 11 lifecycle/repository tests | Draft/review/published/unpublished paths and public filtering | Added explicit review/unpublish timestamps without a migration |
| 2.2 | `tests/api-admin-content-actions.test.ts`, `tests/admin-content-{page,nuevo,preview}.test.tsx` | Integration | 20/20 existing article/Admin tests | Failed: new Admin routes unresolved | Passed: 5 route/page tests | Non-Admin denial; review, publish, unpublish; draft preview/intake | Shared lifecycle state mapping and one action endpoint |
| 2.3 | Focused PR2 command plus public/Admin regressions | Integration | 38/38 focused tests before final type check | Existing public/Admin behavior re-run | Passed: 12 files, 38 tests; TypeScript passed | Published-only public query plus Admin-only layout/action paths | No public Blog component or access behavior changed |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- tests/admin-*.test* tests/api-admin-health.test.ts tests/middleware.test.ts` — exit 0; 12 files, 40 tests passed. |
| Type check | `npx tsc --noEmit` — exit 0. |
| Runtime harness command/scenario and exact result | N/A — no E2E/runtime harness is configured; the protected route behavior is covered at the API and server-layout integration boundaries. |
| Rollback boundary | Revert health files under `src/lib/admin/health`, `src/app/api/admin/health`, `src/app/admin/salud`, shell components, and the four Admin page/layout integrations. `admin-navbar.tsx`, middleware, access logic, and temporary `/admin/blog/*` tool remain intact. |

## PR2 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- tests/admin-content*.test* tests/api-admin-content-actions.test.ts tests/article*.test* tests/blog-navbar.test.tsx tests/admin-navbar.test.tsx tests/admin-shell.test.tsx tests/admin-layout.test.tsx` — exit 0; 12 files, 38 tests passed. |
| Type check | `npx tsc --noEmit` — exit 0. |
| Runtime harness command/scenario and exact result | N/A — no E2E/runtime harness is configured; repository, protected API, server-page, and layout integration boundaries are covered. |
| Rollback boundary | Revert `src/lib/admin/content/lifecycle.ts`, `src/lib/db/{models,repository}/article.ts`, `src/app/admin/contenido`, `src/app/api/admin/articles/[id]`, `src/components/admin/content-actions.tsx`, and the Admin navigation/form integration; restore the deleted temporary `/admin/blog/*` pages and tests as the paired rollback. |

## Scope Confirmation

- No public UI redesign or Blog access changes; public queries remain `published: true`, so drafts and unpublished articles are denied to subscribers.
- No migrations, laboratory/data/user work, MongoDB console, or Stitch changes.
- No secrets, credentials, tokens, identities, raw errors, or infrastructure details are returned by health output.
- The existing Admin terminology correction diff was preserved and not altered as part of this work.

## Remaining Tasks

PR3–PR4 remain unchecked and out of scope.
