# Apply Progress: Lotes First-Class Architecture

## Delivery Boundary

- Delivery mode: auto-chain, stacked-to-main.
- Current work unit: PR 1 — Lifecycle repository invariants.
- PR 1 status: implemented and verified locally; uncommitted and pending review receipt. It is not closed.
- Scope: repository lifecycle guards, lifecycle permissions contract, and focused tests only.
- Completed tasks: 1.1, 1.2, 1.3.
- Remaining tasks: Phases 2–5.
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
