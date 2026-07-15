# Tasks: Dashboard Admin

## Review Workload Forecast

| PR | Lines | 800-risk | Depends on | Acceptance / rollback |
|---|---:|---|---|---|
| 1 | 550–750 | Low | readiness approval | boundary/tool remain; revert shell/health |
| 2 | 650–800 | Medium | verified PR1 | private drafts; revert content module |
| 3 | 650–800 | Medium | verified PR2, ownership approval | safe projection; revert botanical module |
| 4 | 500–700 | Low | verified PR3, vocabulary approval | safe confirmed changes; retain roles/statuses |

Delivery: force chained PRs; PR1 → PR2 → PR3 → PR4. Chain strategy is not selected.

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
800-line budget risk: Medium

### Suggested Work Units

| PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|
| 1 | `npm run test:run -- tests/admin-*.test* tests/api-admin-health.test.ts` | N/A: no e2e configured | shell/health files |
| 2 | `npm run test:run -- tests/admin-content*.test* tests/article*.test*` | N/A: no e2e configured | content routes/lifecycle |
| 3 | `npm run test:run -- tests/admin-botanico*.test* tests/plant*.test*` | N/A: no e2e configured | botanical module |
| 4 | `npm run test:run -- tests/admin-users*.test* tests/user*.test*` | N/A: no e2e configured | user controls/activity |

## Phase 1: PR1 — Admin Shell and System Health

- [x] 1.1 Gate: approve the designed application/auth signals and 1000ms bound; stop without approval.
- [x] 1.2 RED: add probe/aggregator tests for timeout/throw → `unavailable`, exact boolean allowlists, and forbidden-key absence.
- [x] 1.3 GREEN: create `src/lib/admin/health/{types,aggregator,index}.ts` and `probes/{application,mongo,auth}.ts`; use MongoDB `connectToDatabase()` ping and static auth capability.
- [x] 1.4 REFACTOR: centralize allowlists and value-free unavailable logs; rerun the PR1 command.
- [x] 1.5 RED: add shell, `/admin/salud`, and API tests for Admin-only access, exact safe JSON, and generic three-card health.
- [x] 1.6 GREEN/REFACTOR: add `src/components/admin/{admin-shell,admin-sidebar,admin-header,health-card}.tsx`, `/admin/salud`, `/api/admin/health`; update `src/app/admin/{layout,page}.tsx` and `admin/blog/{page,nuevo/page}.tsx`, retaining `admin-navbar.tsx` and the temporary tool.
- [x] 1.7 Verify `tests/middleware.test.ts` and `tests/admin-layout.test.tsx`; accept only blocked non-Admin and no secrets/raw errors/identity. Non-goals: public UI/Blog access, Stitch, migrations, laboratory workflows.

## Phase 2: PR2 — Content Private Draft Lifecycle

- [x] 2.1 RED: test intake → private draft, review/preview/publish/unpublish, and draft/unpublished public denial.
- [x] 2.2 GREEN/REFACTOR: add `src/lib/admin/content/lifecycle.ts`, extend `src/lib/db/repository/article.ts`, add `src/app/admin/contenido/*`, then delete `src/app/admin/blog/*` only after passing.
- [x] 2.3 Verify PR2 command; accept subscriber-only published content. Non-goals: public Blog redesign, access changes, migrations, Stitch.

## Phase 3: PR3 — Botanical Data

- [ ] 3.1 Gate: approve oils/extracts ownership and laboratory coordination; stop without it.
- [ ] 3.2 RED: test valid private save, invalid no-op, and public exclusion of internal botanical/laboratory fields.
- [ ] 3.3 GREEN/REFACTOR: add `src/lib/admin/botanico/*`, `src/app/admin/botanico/*`, validation beside `src/lib/db/repository/plant.ts`; retain `src/lib/jardin-digital/projection.ts` as public path.
- [ ] 3.4 Verify PR3 command; accept `plantas` as source of truth. Non-goals: laboratory redesign, migrations, public expansion.

## Phase 4: PR4 — Users, Roles, and Minimal Activity

- [ ] 4.1 Gate: approve access-status transitions, activity vocabulary, and retention; stop without them.
- [ ] 4.2 RED: test protected approved-field directory, confirm/cancel/reject, one-user role changes, unapproved-status denial, and event redaction.
- [ ] 4.3 GREEN/REFACTOR: add `src/lib/admin/users/{role-change,activity}.ts` and `src/app/admin/usuarios/*`; expose approved operational summaries only.
- [ ] 4.4 Verify PR4 command; accept Admin-confirmed approved mutations only. Non-goals: credentials/tokens/raw auth, surveillance, unapproved statuses, Stitch.
