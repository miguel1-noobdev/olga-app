## Exploration: Dashboard Admin

### Status
Ready for proposal. This exploration is planning-only; no application code, migrations, commits, pushes, or Stitch assets were changed.

### Executive Summary
The current `/admin` area already has a defense-in-depth `admin` boundary: middleware protects every `/admin/**` path and the server layout repeats the role check. It is only a temporary article tool with a small navbar and no shared dashboard shell.

PR1 should establish the desktop-first Dashboard Admin shell from the approved visual study, retain the existing access controls, and add a server-side System Health read model for application, MongoDB, and authentication configuration/session capability. It must not start content, botanical-data, or user-management implementation.

### Current State Map
- **Authorization**: `src/middleware.ts` redirects unauthenticated `/admin/**` requests to login and rejects every non-`admin` role. `src/app/admin/layout.tsx` repeats this server-side check. `src/lib/auth/roles.ts` is the canonical role helper; `admin` is the technical role.
- **Current Admin UI**: `src/app/admin/page.tsx`, `src/app/admin/blog/page.tsx`, and `src/app/admin/blog/nuevo/page.tsx` each render `src/components/admin/admin-navbar.tsx`. The temporary article list reads published records only, so drafts are not currently visible there.
- **Content behavior**: `src/lib/db/repository/article.ts` already exposes `publish` and `unpublish`, but `create` immediately sets `published: true`. `src/app/api/admin/articles/route.ts` enforces the role but also creates published content. PR2 must change this lifecycle so every intake is private draft.
- **MongoDB**: `src/lib/db/connect.ts` owns the cached Mongoose connection and falls back to the local `botanica-ob` database. There is no reusable health-check abstraction or health route. Existing database usage is direct repository access after `connectToDatabase()`.
- **Authentication**: `src/lib/auth/options.ts` configures NextAuth credentials and Google providers, JWT sessions, and database-backed credential authorization. The health UI must report only safe readiness/configuration facts, never secrets, tokens, user identities, or credential values.
- **Testing**: Vitest is the active runner (`npm test`, `npm run test:run`) with React Testing Library and `mongodb-memory-server`. Existing tests mock middleware/session dependencies, including `tests/middleware.test.ts` and `tests/admin-layout.test.tsx`.
- **Public botanical projection**: `src/lib/db/repository/plant.ts` exposes the complete record, including `internal`; `src/lib/jardin-digital/projection.ts` intentionally removes internal and operational fields for public routes. `src/lib/plantas/full-domain.ts` is the private full-domain entry point. Tests explicitly protect this separation in `tests/jardin-digital-projection.test.ts`.
- **Laboratorio coupling**: `/laboratorio/**` allows both staff roles via `isStaff`, while `/admin/**` remains `admin` only. The laboratory currently owns oils through `src/lib/db/repository/oil.ts` and `/laboratorio/aceites`; botanical-data work must avoid reshaping those records without coordinating with the concurrent laboratory domain.
- **Visual reference**: Stitch project `projects/13503137979360409383` and design system `assets/1056042684670043993` provide a desktop shell and operational flows. They are reference-only and were not changed.

### Proposed PR Boundaries
1. **PR1 — Admin foundation and System Health**
   - Shared Dashboard Admin shell, desktop-first navigation, explicit loading/empty/error/permission states, and `/admin` home.
   - Preserve and test the existing `admin` middleware plus server-layout boundary.
   - Add safe application, MongoDB, and authentication readiness checks, a server-side aggregation/read model, and System Health presentation/tests.
   - Forecast: chained delivery; keep implementation slices below the agreed 800 changed-line approval threshold.

2. **PR2 — Content**
   - Absorb the temporary article tooling under the shared shell.
   - Intake from externally authored, AI-assisted material always creates a private draft.
   - Add review, preview, publish, and unpublish controls; preserve the subscriber-only public Blog contract.

3. **PR3 — Botanical Data**
   - Validated Admin management for plants plus oils/extracts, without a raw MongoDB console.
   - Retain the public projection boundary and keep internal records private.
   - Coordinate repository/schema ownership with laboratorio work before changing oils or plant fields.

4. **PR4 — Users**
   - Directory, role and access-status changes with safety constraints and confirmation.
   - Privacy-respecting activity: operational events only, with no secrets, credentials, or unnecessary personal data.

### PR1 Change Surface
- `src/app/admin/layout.tsx` — retain server authorization while hosting the shared shell.
- `src/middleware.ts` and `src/lib/auth/roles.ts` — verify, not broaden, the `admin` boundary.
- `src/components/admin/` — replace the temporary navbar with reusable shell/navigation/status primitives.
- `src/app/admin/page.tsx` and a new System Health route/page as needed — operational home and health presentation.
- `src/lib/db/connect.ts` plus a dedicated health service — bounded MongoDB readiness probe; no direct database console.
- `src/lib/auth/options.ts` or a narrowly scoped authentication-readiness adapter — safe auth capability signal without secret disclosure.
- `tests/admin-layout.test.tsx`, `tests/middleware.test.ts`, and new focused shell/health tests — red-green coverage for access and health states.

### PR1 Non-Goals
- No article intake, draft lifecycle, review, preview, publish, or unpublish changes.
- No plant, oil, extract, formula, lot, or laboratory repository/schema changes.
- No user directory, role mutation, access-status mutation, or activity-log feature.
- No MongoDB shell, raw collection browser, migration, or database administration console.
- No public Blog, public plant projection, or public navigation redesign.
- No provider, credentials, secret, token, user identity, database URI, or raw error disclosure in System Health.
- No modification of the Stitch study or design system.

### Approaches
1. **Foundation-first chained delivery** — Build shell and safe health read model before operational modules.
   - Pros: isolates access/observability risk; gives every later module one consistent boundary; protects review scope.
   - Cons: does not deliver content management in the first PR.
   - Effort: Medium.

2. **Build content alongside the shell** — Combine PR1 and PR2.
   - Pros: faster visible editorial workflow.
   - Cons: mixes access, infrastructure health, UI foundation, and content lifecycle changes; exceeds the review budget and makes rollback harder.
   - Effort: High.

### Recommendation
Use foundation-first chained delivery. The existing authorization is sound but duplicated UI chrome and missing health abstractions make it the correct seam to stabilize before changing content and data domains. Keep each implementation PR independently testable and below the 800-line approval threshold.

### Unresolved Questions
- What exact authentication signal is meaningful in System Health: provider configuration plus session capability only, or a non-identifying session validation probe? The latter should not depend on a real user session.
- Should application health mean route/render readiness only, or include deployment/process checks that Next.js cannot reliably know from inside the application?
- What is the retention period and actor/event vocabulary for privacy-respecting activity in PR4?
- Which oils/extracts remain laboratory-owned versus becoming a shared botanical-data vocabulary in PR3?

### Risks
- `connectToDatabase()` has no timeout, reset, or health-specific failure contract; an unhealthy MongoDB instance can make status rendering slow or ambiguous.
- The current article creation path auto-publishes; PR2 must reverse that invariant without exposing drafts publicly.
- Admin currently has laboratory access through `isStaff`; changing that relationship without an explicit decision could break concurrent laboratorio workflows.
- Existing uncommitted terminology corrections touch authorization-adjacent files and tests. They must remain isolated and be preserved without expansion.
- `openspec/specs/user-auth/spec.md` still describes the older first-user and redirect behavior; proposal/spec work should reconcile it with the verified implementation before relying on it as current truth.

### Ready for Proposal
Yes. Proceed with an `admin-dashboard` proposal that locks PR1 to shell, existing `admin` access verification, and safe health checks; defer all operational modules to PR2–PR4.
