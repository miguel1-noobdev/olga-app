# Apply Progress: Lotes First-Class Architecture

## Delivery Boundary

- Delivery mode: auto-chain, stacked-to-main.
- Current work unit: PR 5 — Formula context and Lotes navigation.
- PR 1 status: implemented and verified locally; uncommitted and pending review receipt. It is not closed.
- PR 2 status: implemented and verified locally; uncommitted and pending review receipt. It is not closed.
- Scope: formula context and laboratory navigation only; canonical lifecycle, read/detail, creation, edit, and legacy redirects remain unchanged.
- Completed tasks: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3.
- Remaining tasks: 5.4 chain close and review receipts.
- Chain order: PR 1 lifecycle → PR 2 canonical read/detail/follow-up → PR 3 create → PR 4 edit/legacy redirects → PR 5 formula context/navigation.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `tests/lot-repository.test.ts` | Repository integration | `npm run test:run -- lot-repository`: 36/36 passed | Added lifecycle expectations; failures proved missing in-progress snapshot, completed production, and follow-up guards | `npm run test:run -- lot-repository`: 41/41 passed | Planned provenance scaling, in-progress target-gram rejection, completed freeze/follow-up, and cancelled edit paths | Clean after review; no further change needed |
| 1.2 | `tests/lot-repository.test.ts` | Repository integration | Covered by task 1.1 baseline | Tests from 1.1 failed before implementation | `npm run test:run -- lot-repository`: 41/41 passed | Same lifecycle matrix exercised against repository updates | `LotLifecycleError` centralizes invariant failures |
| 1.3 | `tests/lot-edit-form-contract.test.ts` | Unit | Existing contract tests: 13/13 passed in the RED execution | Added permissions contract; 3 failures proved missing export | `npm run test:run -- lot-edit-form-contract`: 16/16 passed | Planned/cancelled rescaling, in-progress snapshot freeze, and completed production freeze cover distinct lifecycle paths | Permission interface and helper are small and explicit |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- lot-repository` — 41/41 passed; `npm run test:run -- lot-edit-form-contract` — 16/16 passed |
| Runtime harness command/scenario and exact result | N/A — this repository-only unit has no application runtime boundary; MongoMemoryServer exercises persistence behavior in the focused repository suite. |
| Full deterministic test result | `npm run test:run` — 79 files, 680 tests passed. |
| Diff validation | `git diff --check` — passed with no whitespace errors. |
| Rollback boundary | Recover only through a Git revert to a version retaining mandatory lifecycle guards, or a targeted fix-forward; no routes, UI, schema, migrations, flags, or configuration were changed. |

## Implementation Notes

- Planned lots rescale only their persisted `formulaSnapshot`; the repository does not query formulas during updates.
- In-progress lots reject target-gram changes and snapshot regeneration while allowing other production edits; completed lots reject every production-field mutation. Both allow atomic `$push` follow-up appends.
- Snapshot regeneration is allowed only for `planned` and `cancelled`; those statuses retain target-gram edits and rescale only their own persisted snapshots.
- All four statuses permit append-only dated follow-up; `completed` keeps production data frozen and does not block follow-up.
- No deviation from the approved repository lifecycle design.

## Corrective Transaction: Confirmed PR 1 Findings

- Production-field updates now use an atomic `findOneAndUpdate` filter that excludes records already transitioned to `completed`; a race returns `LotLifecycleError('completed_freeze')` without writing the production update.
- Follow-up-only appends retain their unguarded `$push` filter, preserving append-only behavior for every status.
- Cancelled lots may now rescale their own persisted snapshot, matching the approved lifecycle contract.
- `LotValidationError('target_batch_grams_invalid')` distinguishes invalid target grams from `LotLifecycleError` lifecycle rejections.

## Corrective TDD Cycle Evidence

| Transaction | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| CT-1 atomic completed race | `tests/lot-repository.test.ts` | Repository integration | `npm run test:run -- lot-repository`: 41/41 passed | Race test resolved an unsafe update | 43/43 passed | Existing completed append test plus simulated completion race | Atomic filter with explicit lifecycle classification |
| CT-2 cancelled rescale | `tests/lot-repository.test.ts`, `tests/lot-edit-form-contract.test.ts` | Repository integration + unit | Repository 41/41; contract 16/16 | Cancelled scaling rejected; permission was false | Repository 43/43; contract 16/16 passed | Planned and cancelled provenance scaling exercise distinct permitted statuses; in-progress remains rejected | Permission predicate remains explicit |
| CT-3 error classification | `tests/lot-repository.test.ts` | Repository integration | Repository 43/43 after CT-1/CT-2 | Generic validation error lacked a reason | 43/43 passed | Zero and negative inputs share the typed validation reason | Dedicated validation error limits classification to the confirmed input invariant |

## Corrective Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- lot-repository` — 43/43 passed; `npm run test:run -- lot-edit-form-contract` — 16/16 passed. |
| Runtime harness command/scenario and exact result | N/A — repository-only boundary; MongoMemoryServer ran the simulated lifecycle completion race and persisted-state assertions. |
| Full deterministic test result | `npm run test:run` — 79 files, 682 tests passed. |
| Diff validation | `git diff --check` — passed with no whitespace errors. |
| Rollback boundary | PR 1 is uncommitted: retain the mandatory guards and recover only through a targeted fix-forward or, after a commit exists, a Git revert to a guarded version. No routes, UI, schema, migrations, flags, commits, pushes, or PR scope changes. |

## Review Gate

- PR 1 remains open in the delivery chain until its review receipt is recorded; implementation and verification evidence do not close the work unit.

## PR 2 TDD Cycle Evidence

| Task | Test File | Layer | RED | GREEN | REFACTOR |
|---|---|---|---|---|---|
| 2.1 | `tests/laboratorio-lotes-list.test.tsx` | Server-component integration | `npm run test:run -- laboratorio-lotes-list` failed because the canonical route did not exist. | 2/2 passed after the list route called `LotRepository.findAll()` and rendered canonical links. | Kept the page limited to global listing; navigation changes remain PR 5. |
| 2.2 | `tests/laboratorio-lotes-list.test.tsx` | Server-component integration | Tests from 2.1 failed before production code. | 2/2 passed. | No further change required. |
| 2.3 | `tests/laboratorio-lotes-detail.test.tsx` | Server-component integration | `npm run test:run -- laboratorio-lotes-detail` failed because the canonical detail route did not exist. | 6/6 passed after canonical detail and follow-up wiring. The inherited repository suite proves atomic `$push` behavior. | Preserved the existing follow-up form contract and repository boundary. |
| 2.4 | `tests/laboratorio-lotes-detail.test.tsx` | Server-component integration | Tests from 2.3 failed before production code. | 6/6 passed. | Canonical action redirects only to the canonical detail route. |

## PR 2 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- laboratorio-lotes-list laboratorio-lotes-detail` — 2 files, 8/8 passed. |
| Runtime harness command/scenario and exact result | N/A — server-component routes use repository and action mocks. The persistence boundary is exercised by `tests/lot-repository.test.ts`, including atomic concurrent `$push` follow-up behavior. |
| Full deterministic test result | `npm run test:run` — 81 files, 690 tests passed. |
| Build result | `npm run build` compiled and type-checked successfully, then exited during unrelated static prerendering because local MongoDB at `127.0.0.1:27017` is unavailable. |
| Diff validation | `git diff --check` — passed with no whitespace errors. |
| Rollback boundary | `src/app/laboratorio/lotes/**` and the two canonical route test files. Reverting them removes only PR 2 routes; no legacy routes, navigation, formula creation, schema, or lifecycle guards are touched. |

## PR 2 Implementation Notes

- The global list is canonical at `/laboratorio/lotes` and reads every lot through `LotRepository.findAll()`.
- Canonical detail reads the lot by `lotId`, renders provenance from immutable lot fields, links to its formula context, and returns `notFound()` for absent lots.
- Canonical follow-up calls the guarded repository update with only a single follow-up entry. The repository's existing `$push` path remains the sole append mechanism and applies to every lifecycle status.
- PR 3 formula creation, PR 4 edit/legacy redirects, and PR 5 navigation remain untouched.

## PR 3 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 3.1 | `tests/laboratorio-lotes-nuevo.test.tsx` | Server-component/action integration | `npm run test:run -- lot-form laboratorio-lotes-list laboratorio-lotes-detail` — 4 files, 26/26 passed | Test failed to resolve the absent canonical page/action modules. | `npm run test:run -- laboratorio-lotes-nuevo` — 5/5 passed. | Validated preselection, no-formula empty state, submit revalidation rejection, and canonical planned creation/redirect exercise distinct paths. Scaled immutable snapshot persistence is covered by `tests/lot-repository.test.ts` (43/43). | Converted target grams to a number at client/action boundaries; focused suite remained green. |
| 3.2 | `tests/laboratorio-lotes-nuevo.test.tsx` | Server-component/action integration | New route/component files; page dependencies covered by the 26/26 safety-net result. | Tests from 3.1 failed before implementation. | `npm run test:run -- laboratorio-lotes-nuevo` — 5/5 passed. | Validated-only selector/preselection and server-side status revalidation cover different creation paths; action forces `planned` status before repository creation. | Kept creation-specific values isolated from the legacy lot form; no legacy route or navigation changes. |

## PR 3 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- laboratorio-lotes-nuevo lot-repository` — 2 files, 48/48 passed. The repository suite includes scaled ingredient snapshot, rounding, provenance, and validated-status guard cases. |
| Runtime harness command/scenario and exact result | N/A — canonical page/action tests use repository and redirect mocks; the MongoMemoryServer repository suite exercised persisted scaled snapshots. |
| Full deterministic test result | `npm run test:run` — 82 files, 695/695 passed. |
| Type check | `npx tsc --noEmit --pretty false` remains blocked by a pre-existing incompatible `findOneAndUpdate` mock signature at `tests/lot-repository.test.ts:546`; no errors originate in PR 3 files. |
| Diff validation | `git diff --check` — passed with no whitespace errors. |
| Rollback boundary | `src/app/laboratorio/lotes/nuevo/**`, `src/components/laboratorio/lot-creation-form.tsx`, and `tests/laboratorio-lotes-nuevo.test.tsx`. Reverting them removes only canonical PR 3 creation; mandatory repository lifecycle/snapshot safeguards remain. |

## PR 3 Implementation Notes

- The canonical page queries only `FormulaRepository.findByStatus('validated')`; a query-string `formulaId` is selected only when it exists in that current result.
- The action reloads the selected formula and rejects absent or non-validated formulas before calling `LotRepository.create`.
- The action always passes `status: 'planned'` and redirects successful creation to `/laboratorio/lotes/[newLotId]`.
- Immutable provenance and proportional snapshot scaling remain exclusively enforced by the already-verified `LotRepository.create` boundary.

## PR 4 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 4.1 | `tests/laboratorio-lotes-edit.test.tsx`, `tests/laboratorio-lotes-edit-actions.test.ts` | Server-component/action integration | `npm run test:run -- laboratorio-formula-lot-detail lot-edit-form` — 40/40 passed | Canonical edit page import failed because `/lotes/[lotId]/editar` did not exist. | `npm run test:run -- laboratorio-lotes-edit laboratorio-lotes-edit-actions` — 7/7 passed. | Planned rescale, in-progress freeze, completed freeze, not-found, invalid grams, and canonical redirect cover distinct lifecycle paths. | Centralized UI permissions through the existing lifecycle contract; action avoids resubmitting an unchanged target batch. |
| 4.2 | `tests/laboratorio-lotes-edit.test.tsx`, `tests/laboratorio-lotes-edit-actions.test.ts` | Server-component/action integration | Covered by task 4.1 baseline | Tests from 4.1 failed before canonical page/action implementation. | 7/7 passed. | Read-only and mutation paths exercise separate status rules. | Canonical route only; no formula-context navigation added. |
| 4.3 | `tests/laboratorio-formula-lot-redirects.test.tsx` | Route integration | `npm run test:run -- laboratorio-formula-lot-detail lot-edit-form` — 40/40 passed | Redirect assertions failed against rendered legacy screens and legacy create's non-404 fallback. | `npm run test:run -- laboratorio-formula-lot-redirects` — 5/5 passed. | Matching detail, matching edit, mismatched ownership, validated create, unavailable create, and unvalidated create cover each route branch. | Consolidated compatibility coverage in one redirect-focused suite. |
| 4.4 | `tests/laboratorio-formula-lot-redirects.test.tsx` | Route integration | Covered by task 4.3 baseline | Tests from 4.3 failed before redirect-only routes. | 5/5 passed. | Detail/edit ownership and create formula-context validation remain intentionally separate checks. | Removed unreferenced legacy screens/actions and migrated follow-up action coverage to the canonical action. |

## PR 4 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- laboratorio-lotes-edit laboratorio-lotes-edit-actions laboratorio-formula-lot-redirects lot-edit-form lot-edit-form-contract laboratorio-formula-lot-follow-up-actions` — 6 files, 40/40 passed. |
| Runtime harness command/scenario and exact result | N/A — App Router pages/actions are isolated with route and repository mocks; the focused suites execute matching redirects, 404 paths, and lifecycle permission behavior. |
| Full deterministic test result | `npm run test:run` — 80 files, 670/670 passed. |
| Type check | `npx tsc --noEmit --pretty false` reports only the pre-existing Mongoose mock signature incompatibility at `tests/lot-repository.test.ts:546`; no PR 4 errors. |
| Build result | `npm run build` compiled and type-checked successfully, then static prerendering failed because local MongoDB at `127.0.0.1:27017` is unavailable. |
| Diff validation | `git diff --check` — passed with no whitespace errors. |
| Rollback boundary | Canonical `lotes/[lotId]/editar`, compatibility `formulas/[id]/lotes/**`, edit form contract/component, and redirect/edit tests. Reverting this slice removes only PR 4 edit and compatibility behavior; lifecycle repository guards and canonical list/detail/create remain. |

## PR 4 Implementation Notes

- Legacy detail and edit resolve the lot by `lotId`, compare `lot.formulaId` to the legacy `params.id`, and redirect only matching ownership to `/laboratorio/lotes/[lotId]` or `/laboratorio/lotes/[lotId]/editar`.
- Legacy create resolves only the formula context: it redirects validated formulas with `?formulaId=` and returns `notFound()` for unavailable or unvalidated formulas.
- The canonical edit route uses lifecycle permissions to enable rescaling only for planned/cancelled lots, preserve in-progress non-snapshot edits, and freeze completed production controls. Follow-up remains available from canonical detail for every status.
- PR 5 formula context and navigation remain excluded.

## PR 5 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 5.1 | `tests/laboratorio-home.test.tsx`, `tests/laboratorio-layout.test.tsx`, `tests/laboratorio-formula-detail.test.tsx` | Server-component and client-navigation integration | `npm run test:run -- laboratorio-home laboratorio-layout laboratorio-formula-detail` — 3 files, 38/38 passed before the change | Replaced legacy and missing-route expectations; focused command failed with 9 assertions because canonical Lotes links were absent | Same focused command — 3 files, 38/38 passed | Covered hub and navbar entries plus validated formula creation preselection and formula lot-history links for multiple formula and lot IDs | Consolidated section terminology to `Lotes`; legacy route UI/actions were already absent after PR 4 and were revalidated by redirect coverage |
| 5.2 | Same as 5.1 | Server-component and client-navigation integration | Covered by task 5.1 baseline | Tests from 5.1 failed before production link changes | Same focused command — 3 files, 38/38 passed | Home, navbar, formula creation, and formula lot-history routes exercise distinct navigation paths | Kept the formula context read-only except for canonical creation shortcut |
| 5.3 | `tests/laboratorio-formula-detail.test.tsx`, `tests/laboratorio-formula-lot-redirects.test.tsx` | Route integration | `npm run test:run -- laboratorio-formula-lot-redirects` — 1 file, 5/5 passed | Canonical formula-context link assertions in task 5.1 failed while legacy URLs were still emitted | Formula context no longer emits legacy nested links; `npm run test:run -- laboratorio-formula-lot-redirects` — 1 file, 5/5 passed confirms legacy routes are redirect-only | Multiple canonical detail links and validated creation preselection rule out formula/lot ID coupling; legacy redirect branches cover matching and rejected contexts | No additional route deletion was required: PR 4 had already removed duplicate legacy screens/actions; this slice removes their last formula-context entry points and standardizes `Lotes`/`Lote` vocabulary |

## PR 5 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- laboratorio-home laboratorio-layout laboratorio-formula-detail` — 3 files, 38/38 passed. `npm run test:run -- laboratorio-formula-lot-redirects` — 1 file, 5/5 passed. |
| Runtime harness command/scenario and exact result | `npm run build` — production Next.js build compiled, type-checked, and generated 21/21 static pages successfully with Docker/MongoDB available. |
| Full deterministic test result | `npm run test:run` — 80 files, 670/670 passed. |
| Diff validation | `git diff --check` — passed with no whitespace errors. |
| Rollback boundary | `src/app/laboratorio/formulas/[id]/page.tsx`, `src/app/laboratorio/page.tsx`, `src/components/laboratorio/laboratory-navbar.tsx`, their three focused test files, and the PR 5 task/progress records. Reverting them removes only canonical navigation and formula-context shortcuts; canonical routes and guarded legacy redirects remain. |

## PR 5 Implementation Notes

- Formula-context lot history links now target `/laboratorio/lotes/[lotId]`; validated formula creation targets `/laboratorio/lotes/nuevo?formulaId=[formulaId]`.
- The laboratory home and desktop/mobile navigation expose `/laboratorio/lotes` as `Lotes`.
- Legacy nested routes remain redirect-only. No duplicate legacy UI or actions were reintroduced.
- No migration, lifecycle behavior, canonical route implementation, or Stitch visual scope changed.

## PR 5 Review Gate

- Task 5.4 remains open. The chain cannot be closed until the required review receipts are recorded for all slices. No commits, pushes, or PRs were created in this apply batch.
