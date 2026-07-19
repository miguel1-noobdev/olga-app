# Proposal: Lotes First-Class Architecture

## Intent

Lotes are the operational center of the laboratory, but the UI still treats them as formula sub-pages. This change promotes `/laboratorio/lotes` to a first-class route tree, centralizes lot creation through validated-formula selection, and hardens lifecycle rules so production snapshots remain trustworthy.

> **Canonical lifecycle correction (Fase 3 closure):** New and writable lot statuses are only `in_production`, `finalized`, and `discarded`, displayed as En producción, Finalizado, and Descartado. The normal transition is `in_production` to `finalized`; `discarded` is the terminal alternative. Finalized lots remain in the same collection as historical records and retain append-only follow-up indefinitely. Legacy `planned`, `in_progress`, `completed`, and `cancelled` values are read-compatible only.

## Scope

### In Scope
- Canonical routes: `/laboratorio/lotes`, `/laboratorio/lotes/nuevo`, `/laboratorio/lotes/[lotId]`, `/laboratorio/lotes/[lotId]/editar`.
- Global lot list backed by `LotRepository.findAll()`.
- Creation flow that selects a validated formula and scales its snapshot to the chosen target grams.
- Detail page with formula provenance, operational summary, snapshot, and append-only follow-up section.
- Edit page with lifecycle-aware guards at the intentionally canonical Spanish segment `/laboratorio/lotes/[lotId]/editar`.
- Legacy nested detail and edit redirect after lot ownership checks; legacy create redirects after formula-context validation.
- Repository guards: `planned` and `cancelled` may edit target grams and rescale only their own snapshot; `in_progress` permits non-snapshot production edits but blocks target-gram changes and snapshot regeneration; `completed` freezes production data and snapshot; every status permits append-only dated follow-up.
- Navigation and lab home cards pointing to Lotes.

### Out of Scope
- New Production domain, collection, or document.
- MongoDB schema migration or new indexes.
- Formula core recipe mutation after validation.
- Batch/stock/inventory tracking beyond lots.
- Public or subscriber-facing pages.
- Stitch visual redesign (depends on later rollout).

## Capabilities

### New Capabilities
- `lot-global-list`: list all lots at `/laboratorio/lotes`.

### Modified Capabilities
- `lot-create-from-validated-formula`: canonicalize creation, accept only validated preselection, and re-validate on submit.
- `lot-detail-and-follow-up`: move detail to the canonical route and permit append-only follow-up for every status.
- `lot-edit-with-lifecycle`: permit non-snapshot production edits in `in_progress`, while freezing target grams/snapshot there and all production data in `completed`.
- `lot-legacy-route-redirects`: replace legacy screens with guarded redirects; detail/edit check ownership and create validates formula context.
- `lot-repository-lifecycle-guards`: enforce lifecycle mutation guards and typed validation errors.

## Approach

Add the canonical route tree under `src/app/laboratorio/lotes/*` using existing repository queries and components. Move creation entry from formula detail to a global "select validated formula → set grams → create" flow. Keep formula detail as recipe context: show that formula's lot history and a shortcut to creation pre-filled with the formula.

Convert existing nested lot routes into redirect-only pages. Legacy detail and edit verify `lot.formulaId === params.id` before redirecting and return `notFound()` on mismatch; matching edit URLs redirect to `/laboratorio/lotes/[lotId]/editar`. Legacy create validates its formula context rather than lot ownership because no lot is present: a validated formula redirects with canonical preselection, while an unavailable or unvalidated formula returns `notFound()`. The formula-context create link uses the same preselection, while canonical submission re-validates the formula. The canonical lot parameter is `lotId`, and `/editar` is the intentional canonical Spanish edit segment. Centralize lifecycle checks in `LotRepository.update`: `planned` and `cancelled` lots may regenerate only their own snapshot on target-gram change; `in_progress` blocks target-gram changes and snapshot regeneration but permits other production edits; `completed` freezes production fields and snapshot; every status permits append-only dated follow-up.

| Status | Production data and snapshot | Follow-up |
|---|---|---|
| `planned` | Target grams may rescale the lot's own snapshot. | Append-only dated entries allowed. |
| `in_progress` | Non-snapshot production fields editable; target grams and snapshot frozen. | Append-only dated entries allowed. |
| `completed` | Frozen. | Append-only dated entries allowed. |
| `cancelled` | Target grams may rescale the lot's own snapshot. | Append-only dated entries allowed. |

## Delivery Plan

The implementation is exactly five chained PRs: lifecycle → canonical read/detail/follow-up → create → edit/legacy redirects → formula context/navigation.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/app/laboratorio/lotes/*` | New | Canonical list, create, detail, edit routes. |
| `src/app/laboratorio/formulas/[id]/lotes/*` | Modified | Become redirect-only compatibility routes. |
| `src/app/laboratorio/formulas/[id]/page.tsx` | Modified | Link lots to canonical detail; keep create shortcut. |
| `src/app/laboratorio/page.tsx` | Modified | Add Lotes hub card and suggested flow. |
| `src/components/laboratorio/laboratory-navbar.tsx` | Modified | Add Lotes nav link. |
| `src/lib/db/repository/lot.ts` | Modified | Enforce lifecycle guards and expose `LotLifecycleError` plus `LotValidationError`. |
| `src/lib/lots/lot-edit-form-contract.ts` | Modified | Include lifecycle-safe fields. |
| `tests/*lot*` | Modified | Migrate to canonical routes; add lifecycle tests. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Legacy redirect ownership check missing | Low | Verify `lot.formulaId === params.id` before redirect; 404 otherwise. |
| Lifecycle guard breaks existing lifecycle data | Med | Add tests with current documents; only reject disallowed mutations, never alter persisted snapshots. |
| Route migration breaks existing tests | Med | Update tests to canonical routes and keep redirect coverage. |

## Rollback Plan

1. Recover only through a Git revert to a version that retains the mandatory lifecycle guards, or through a targeted fix-forward change.
2. Never restore a pre-guard nested route or any version that weakens, bypasses, or omits the mandatory lifecycle invariants.
3. If repository guards reject valid edits, fix forward or revert only when completed snapshots and production data remain protected.

## Dependencies

- Later Stitch visual rollout for final laboratory polish.
- Existing validated formulas to drive lot creation.

## Success Criteria

- [ ] `/laboratorio/lotes` lists all lots.
- [ ] Lot creation selects a validated formula and redirects to `/laboratorio/lotes/[lotId]`.
- [ ] Detail/edit use canonical routes and link back to formula context.
- [ ] Matching legacy detail/edit URLs redirect after ownership checks; ownership mismatches return `notFound()`. Legacy create validates formula context, redirects only for a validated formula, and returns `notFound()` for an unavailable or unvalidated formula. Legacy and formula-context creation preserve validated preselection; canonical submission re-validates it.
- [ ] `planned` and `cancelled` lots regenerate their own snapshots on target-gram change; `in_progress` blocks target-gram changes and snapshot regeneration while permitting other production edits; `completed` freezes production data/snapshot; all four statuses allow append-only dated follow-up.
- [ ] `completed` keeps production data frozen and does not block follow-up.
- [ ] All existing lot documents load without migration.
