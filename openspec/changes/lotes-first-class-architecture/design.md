# Design: Lotes First-Class Architecture

## Technical Approach

Promote `/laboratorio/lotes/*` to a first-class route tree (list, create, detail, edit, follow-up) reusing `LotRepository` queries. Creation moves to "select validated formula → set grams → create" with server-side re-validation; formula-context and legacy-create redirects carry a validated formula into canonical preselection. Convert `/laboratorio/formulas/[id]/lotes/*` into redirect-only pages: detail and edit check `lot.formulaId === params.id`, while create validates the formula context because it has no lot. The canonical lot parameter is `lotId`, and `/editar` is the intentional canonical Spanish edit segment. Centralize lifecycle guards in `LotRepository.update` as MANDATORY invariants: `planned` and `cancelled` may edit target grams and rescale only their own snapshot; `in_progress` permits non-snapshot production edits but blocks target-gram changes and snapshot regeneration; `completed` freezes all production data and snapshot; all statuses permit append-only dated follow-up. Formula context keeps lot history and a creation shortcut but stops owning canonical navigation. No Mongo migration. Naming: `Lotes` (section), `Lote` (record).

**Canonical lifecycle correction:** The active contract supersedes the historical vocabulary in this document: only `in_production`, `finalized`, and `discarded` are writable. `in_production` is the only production-editable status; `finalized` and `discarded` are terminal. Follow-up remains append-only for all three, and finalized records stay in the same collection as history. Legacy values are normalized only when reading persisted documents.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| New `lotes/*` canonical | Larger diff | Matches operational model. |
| Lifecycle guard inside `LotRepository.update` | Couples guard to data layer | Single source of truth. |
| Rescale from existing `formulaSnapshot` | Drift if formula changes | Provenance immutability. |
| `$push` follow-up for every status | Never truncate | Follow-up remains append-only across the lifecycle. |
| Legacy as redirect-only + ownership | One-time migration | One canonical UI. |
| `lotes/nuevo` lists validated formulas | Two-step UX | Removes URL friction. |
| `/editar` canonical edit segment | Spanish route convention | Intentional canonical convention for laboratory routes. |
| Stitch visuals deferred | Keep current look | Proposal out-of-scope. |
| Chained PRs | More merge ceremony | Under 400-line budget per slice. |

| Status | Production/snapshot rule | Follow-up rule |
|---|---|---|
| `planned` | Target grams may rescale only this lot's snapshot. | Append-only dated entries allowed. |
| `in_progress` | Non-snapshot production fields remain editable; target grams and snapshot are frozen. | Append-only dated entries allowed. |
| `completed` | Production data and snapshot frozen. | Append-only dated entries allowed. |
| `cancelled` | Target grams may rescale only this lot's snapshot. | Append-only dated entries allowed. |

## Data Flow

```
[lotes] findAll() -> list, links to /lotes/[lotId]
[lotes/nuevo] findByStatus('validated') -> selector
            submit -> create (re-validates) -> redirect /lotes/[newLotId]
[lotes/[lotId]] findById(lot)+findById(formula) -> provenance, snapshot, follow-up
               follow-up form -> $push only
[lotes/[lotId]/editar] findById(lot) -> lifecycle form
                   planned/cancelled -> target grams may rescale own snapshot
                   in_progress -> target grams and snapshot frozen; other production fields editable
                   completed -> production and snapshot frozen
                   every status -> append-only dated follow-up
[legacy formulas/[id]/lotes/[lotId]] findById(lot)
    if lot.formulaId!==params.id: notFound() else redirect /lotes/[lotId]
[legacy formulas/[id]/lotes/[lotId]/edit] findById(lot)
    if lot.formulaId!==params.id: notFound() else redirect /lotes/[lotId]/editar
[legacy formulas/[id]/lotes/nuevo] validate formula context
    if formula is unavailable or not validated: notFound() else redirect /lotes/nuevo?formulaId=[id]
[formulas/[id]] lot history links canonical; "Create lot" -> /lotes/nuevo?formulaId=[id]
[lotes/nuevo] preselects formulaId when validated; submit re-validates before creation
```

## File Changes

| Group | Files |
|---|---|
| Create | `lotes/{page,nuevo/page,nuevo/actions}.tsx` — list, validated selector, `submitNewLot`. |
| Detail + follow-up | `lotes/[lotId]/{page,actions}.tsx` — detail + `appendLotFollowUp` ($push only). |
| Edit | `lotes/[lotId]/editar/{page,actions}.tsx` — lifecycle form + `submitLotEdit`. |
| Legacy | `formulas/[id]/lotes/{page,nuevo/page,[lotId]/page,[lotId]/edit/page}.tsx` redirects to canonical after detail/edit ownership checks or legacy-create formula-context validation; no legacy screen or action remains. |
| Context + nav | `formulas/[id]/page.tsx`, `laboratorio/page.tsx`, `laboratory-navbar.tsx`, `lot-form.tsx`. |
| Library | `lib/db/repository/lot.ts` (`LotLifecycleError`, `LotValidationError`, and guards), `lib/lots/lot-edit-form-contract.ts` (`LotLifecyclePermissions`). |
| Tests | `tests/lot-repository.test.ts` + new `tests/laboratorio-lotes-{list,nuevo,detail,edit}.test.tsx`; migrate `laboratorio-formula-lot-detail.test.tsx`; delete `laboratorio-formula-lot-{create,edit}.test.tsx`; update `laboratorio-home.test.tsx`, `laboratorio-layout.test.tsx`. |

## Interfaces / Contracts

```ts
// src/lib/db/repository/lot.ts
export class LotLifecycleError extends Error {
  // Reports lifecycle-based rejected production mutations.
}
export class LotValidationError extends Error {
  // Reports invalid production input, including invalid target grams.
}
// update(): planned/cancelled may rescale their own snapshot; in_progress blocks
// snapshot regeneration; completed rejects every production change; $push followUp is append-only.
```

```ts
// src/lib/lots/lot-edit-form-contract.ts (added)
export interface LotLifecyclePermissions {
  canEditProduction: boolean;   // every status except completed
  canRescaleSnapshot: boolean;  // planned or cancelled
  canAppendFollowUp: boolean;   // always true
}
```

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit | Lifecycle guards (planned/cancelled rescale, in-progress snapshot freeze, completed production freeze, follow-up under every status) | Extend `tests/lot-repository.test.ts` with MongoMemoryServer. |
| Integration | Canonical pages render + redirect | New `laboratorio-lotes-*.test.tsx` mock `getServerSession`, repositories. |
| Integration | Legacy redirects | Migrate legacy detail/create/edit tests; assert matching detail/edit redirect, mismatched ownership `notFound`, validated legacy-create preselection, and unvalidated or unavailable legacy-create `notFound`. |
| Unit | Form contract exposes lifecycle permissions | Extend `lot-edit-form-contract.test.ts`. |

## Threat Matrix

N/A — no shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is changed. Only Next.js App Router navigation, server actions, and a Mongo repository are involved.

## Migration / Rollout

No Mongo migration. Rollout is route-only via chained PRs; legacy URLs still resolve.

**Rollback** (Git revert/fix-forward only): revert only to a release that retains the mandatory lifecycle guards, or ship a fix-forward. Never restore a pre-guard legacy route or any version that weakens or omits lifecycle invariants. Lifecycle guards are MANDATORY; no env, config, feature flag, or runtime switch may weaken them.

## Open Questions

None. Approved decision (#725) locks the append-only follow-up policy and the mandatory lifecycle invariants.

## Forecasted Chained PRs (under 400 authored lines each)

| PR | Scope | Lines | Close |
|---|---|---|---|
| 1 — Lifecycle | `lot.ts` + `LotLifecycleError` + `LotValidationError` + repo tests | ~280 | Tests pass; no route changes. |
| 2 — List/detail/follow-up | `lotes/page.tsx`, `lotes/[lotId]/*`, list/detail component, tests | ~340 | Index + detail render; follow-up atomic. |
| 3 — Create (validated selector) | `lotes/nuevo/*`, selector + form, tests | ~260 | Selector lists validated only; preselection is accepted only for a validated formula; submission re-validates and redirects to canonical detail. |
| 4 — Edit + legacy redirects | `lotes/[lotId]/editar/*`, legacy redirect-only, tests | ~360 | `/editar` is intentional; matching legacy detail/edit redirect, mismatches return 404, and legacy create validates its formula context before redirecting or returning 404. |
| 5 — Formula context + navigation | formula context links, laboratory home, navbar, tests | ~220 | Formula history, hub, and navbar expose canonical Lotes routes; formula-context creation carries validated preselection. |

Decision needed before apply: No. Chained PRs recommended: Yes. 400-line budget risk: Low (per slice, after generated tests counted separately).
