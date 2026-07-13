## Exploration: Lotes First-Class Architecture

### Current State

Lots are persisted as independent Mongo documents with immutable formula provenance (`formulaId`, code, version, and `formulaSnapshot`). Creation already requires a validated formula and proportionally scales the snapshot to the selected target grams. `LotRepository.findAll()` already supports a global list without duplicate data.

The application exposes lots only through formula-nested routes: create at `/laboratorio/formulas/[id]/lotes/nuevo`, detail at `/laboratorio/formulas/[id]/lotes/[lotId]`, and edit at `/laboratorio/formulas/[id]/lotes/[lotId]/edit`. The laboratory home and persistent navigation do not expose a lot destination. The formula detail therefore owns both formula work and operational lot navigation.

`LotRepository.update()` currently permits target-gram changes and rescales the existing snapshot for every status. This correctly avoids rereading the formula, but it does not forbid mutation after a lot has started. Follow-up entries append atomically, but route ownership and redirects remain formula-nested. Formula `useTest.entries` and lot `followUp.entries` are separate dated histories, as they should be.

### Affected Areas

- `src/app/laboratorio/page.tsx` and `src/components/laboratorio/laboratory-navbar.tsx` — expose Lotes as the first-class operational destination.
- `src/app/laboratorio/lotes/*` — add canonical global list, validated-formula selection/create, detail, edit, and follow-up endpoints.
- `src/app/laboratorio/formulas/[id]/page.tsx` — retain formula-context history and shortcuts, but stop owning canonical lot navigation.
- `src/app/laboratorio/formulas/[id]/lotes/**/*` — retain compatibility redirects to canonical lot routes.
- `src/lib/db/repository/lot.ts` and `src/lib/lots/lot-*.ts` — enforce planned-only snapshot regeneration and lifecycle-safe mutations.
- `src/lib/db/models/lot.ts` and `src/lib/lots/lot-types.ts` — preserve the existing lot document; no parallel Production document or Mongo migration is needed.
- `tests/lot-repository.test.ts` and `tests/laboratorio-formula-lot-*.test.*` — migrate route expectations and add lifecycle/immutability coverage.

### Approaches

1. **Canonical Lotes routes with legacy redirects** — Promote lots to `/laboratorio/lotes`, preserve formula pages as recipe/validation context, and redirect the existing nested lot URLs.
   - Pros: Matches operational ownership, keeps old links working, reuses existing records and repository queries.
   - Cons: Requires coordinated route, action, and test migration.
   - Effort: Medium.

2. **Keep formula-nested routes and add a global list only** — Add `/laboratorio/lotes` as an index while retaining nested create/detail/edit as canonical.
   - Pros: Smaller initial diff.
   - Cons: Leaves routing ownership contradictory and keeps operations dependent on formula URL context.
   - Effort: Low initially, High in future maintenance.

### Recommendation

Adopt canonical Lotes routes with legacy redirects. Lotes are the sole operational domain; formulas remain the recipe and validation domain. Creation begins with selection of a validated formula, then captures a scaled snapshot owned by that lot. Never introduce a separate Production concept, duplicate data, or a Mongo migration.

### Staged Correction Plan

| PR | Scope | Test focus |
|---|---|---|
| 1 | Lifecycle: planned/cancelled own-snapshot rescaling, in-progress snapshot freeze, completed production freeze, typed errors, and follow-up for every status. | Repository and lifecycle contract tests. |
| 2 | Canonical read/detail/follow-up: global list, canonical detail, and atomic append-only follow-up. | List and detail tests for all four statuses. |
| 3 | Create: validated-formula selector, re-validation, scaled snapshot, and canonical redirect. | Create route/action tests. |
| 4 | Edit/legacy redirects: lifecycle-aware edit plus redirect-only nested compatibility routes. | Edit tests and `params.id`/`lotId` ownership tests. |
| 5 | Formula context/navigation: formula history links, laboratory home, and navbar. | Formula-detail, home, and layout tests. |

Formula validation observations remain on formula `useTest.entries`; lot operational observations append dated entries to `followUp.entries` for `planned`, `in_progress`, `completed`, and `cancelled` lots. Formula changes never mutate any lot snapshot.

### Risks

- Lifecycle semantics must remain aligned: `in_progress` blocks target-gram changes and snapshot regeneration, `completed` freezes production data, and every status still permits append-only follow-up.
- Date/status transitions currently permit inconsistent combinations (for example, `completed` without `startedAt`), so lifecycle validation must be specified rather than inferred from the current form.
- Legacy routes must verify ownership before redirecting to avoid turning a mismatched formula/lot URL into a valid cross-context link.
- The current test suite encodes nested URLs extensively; route migration is broad even though persistence remains unchanged.

### Ready for Proposal

Yes. The proposal locks the four-status lifecycle, production freeze rules, and follow-up availability, then preserves one canonical Lotes route tree with compatibility redirects and no data migration.
