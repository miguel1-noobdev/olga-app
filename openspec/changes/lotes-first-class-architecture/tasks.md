# Tasks: Lotes First-Class Architecture

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 1,250–1,550 across five slices |
| 400-line budget risk | High overall; Low per PR |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | auto-chain (force-chained) |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Lifecycle repository invariants | PR 1 → main | `npm run test:run -- lot-repository lot-edit-form-contract` | N/A: MongoMemoryServer tests | `src/lib/db/repository/lot.ts` + lifecycle contract + tests |
| 2 | Canonical list, detail, follow-up | PR 2 → main | `npm run test:run -- laboratorio-lotes-list laboratorio-lotes-detail` | N/A: server-component mocks | `src/app/laboratorio/lotes/{page,[lotId]/**}` + tests |
| 3 | Validated-formula creation | PR 3 → main | `npm run test:run -- laboratorio-lotes-nuevo` | N/A: action redirect mocked | `src/app/laboratorio/lotes/nuevo/**` + tests |
| 4 | Edit and guarded legacy redirects | PR 4 → main | `npm run test:run -- laboratorio-lotes-edit laboratorio-formula-lot-detail` | N/A: route mocks verify redirect/notFound | canonical edit + `formulas/[id]/lotes/**` |
| 5 | Formula context and Lotes navigation | PR 5 → main | `npm run test:run -- laboratorio-home laboratorio-layout` | N/A: component integration mocks | formula page, navbar, hub + tests |

## Phase 1: Lifecycle Foundation

- [x] 1.1 RED: extend `tests/lot-repository.test.ts` for planned/cancelled rescale, in-progress target-gram/snapshot rejection, completed production rejection, and append-only dated follow-up for all four statuses.
- [x] 1.2 GREEN: add `LotLifecycleError`, `LotValidationError`, and mandatory guards in `src/lib/db/repository/lot.ts`; rescale only the lot's own snapshot and never reread formulas.
- [x] 1.3 REFACTOR: add `LotLifecyclePermissions` plus contract tests in `src/lib/lots/lot-edit-form-contract.ts`; production editing is allowed except on completed lots, rescaling is limited to planned/cancelled, follow-up remains appendable for every status, and no guard bypass, flag, Production vocabulary, or migration exists.

## Phase 2: Canonical Read and Follow-Up Routes

- [x] 2.1 RED: create `tests/laboratorio-lotes-list.test.tsx` for all lots, empty state, and canonical detail links.
- [x] 2.2 GREEN: create `src/app/laboratorio/lotes/page.tsx` using `LotRepository.findAll()`.
- [x] 2.3 RED: add `tests/laboratorio-lotes-detail.test.tsx` for provenance, `notFound`, and atomic append-only dated `$push` follow-up for planned, in_progress, completed, and cancelled lots.
- [x] 2.4 GREEN: create `src/app/laboratorio/lotes/[lotId]/{page,actions}.tsx` to satisfy detail and append-only follow-up tests.

## Phase 3: Canonical Creation

- [x] 3.1 RED: add `tests/laboratorio-lotes-nuevo.test.tsx` for validated-only selection, empty state, validated `formulaId` preselection, submission re-validation, scaled provenance snapshot, and canonical redirect.
- [x] 3.2 GREEN: create `src/app/laboratorio/lotes/nuevo/{page,actions}.tsx` and selector/form components; accept preselection only for a currently validated formula and reject formulas no longer validated on submit.

## Phase 4: Edit and Compatibility

- [x] 4.1 RED: add `tests/laboratorio-lotes-edit.test.tsx` for planned/cancelled production edits and rescaling, in-progress snapshot controls read-only with other production fields editable, completed production read-only, and follow-up availability for every status.
- [x] 4.2 GREEN: create `src/app/laboratorio/lotes/[lotId]/editar/{page,actions}.tsx` using repository permissions; `/editar` is the intentional canonical Spanish segment, guards remain mandatory, and `completed` keeps production data frozen without blocking follow-up.
- [x] 4.3 RED: migrate legacy route tests for ownership-checked detail and edit redirects, mismatched `notFound()`, matching edit redirect, and legacy-create formula-context validation that redirects with validated `formulaId` preselection or returns `notFound()` when unavailable or unvalidated.
- [x] 4.4 GREEN: convert `src/app/laboratorio/formulas/[id]/lotes/**` detail and edit routes to ownership-checked redirects using `params.id` and `lotId`; convert legacy create to formula-context validation and redirect only for validated formulas. Remove duplicate legacy UI/actions without returning 404 for a matching legacy edit URL.

## Phase 5: Context, Navigation, and Branch Close

- [x] 5.1 RED: update `tests/laboratorio-home.test.tsx`, `tests/laboratorio-layout.test.tsx`, and `tests/laboratorio-formula-detail.test.tsx` for canonical Lotes links.
- [x] 5.2 GREEN: wire canonical links in `src/app/laboratorio/formulas/[id]/page.tsx`, `src/app/laboratorio/page.tsx`, and `src/components/laboratorio/laboratory-navbar.tsx` last; the formula-context create link carries its validated formula into canonical creation preselection.
- [x] 5.3 REFACTOR: remove duplicate route-only code and keep implementation vocabulary limited to Lotes/Lote.
- [ ] 5.4 Close the chain only after canonical routes pass, lifecycle invariants and legacy redirects are proven, no migration exists, and each PR records test/runtime receipts plus review gates; only then resume the Stitch visual worktree.
