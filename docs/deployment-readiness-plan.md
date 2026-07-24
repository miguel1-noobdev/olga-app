# Botánica Esencial OB — Deployment Readiness Plan

This plan prepares the application for a future VPS deployment through Coolify.
Coolify/VPS changes are intentionally the final phase. Each implementation unit
must be tested first, independently reviewable, independently revertible, and
delivered from the hardening branch rather than directly from `main`.

## Current status

- Active branch: `hardening/block-2-mongo-resilience`
- Main application baseline: Block 1 delivered in `1641b2e`
- Current hardening branch is clean and synchronized with origin.
- Completed through Block 9, including privileged-account assurance, mutation-origin policy,
  runtime input contracts, and server-action/form resilience.
- Remaining known high dependency risk: Next.js 14 requires a separate major-line migration decision.
- Coolify and VPS deployment have not started.

## Delivery rules

For every new implementation unit:

1. Work on the hardening branch, never directly on `main`.
2. Write tests or verification checks before production changes when behavior changes.
3. Run focused checks and the relevant full checks.
4. Start one bounded native review for the exact candidate.
5. Stage only reviewed paths.
6. Validate the native `pre-commit` gate before committing.
7. Commit one clear work unit using Conventional Commits.
8. Validate the native `pre-push` gate before pushing.
9. Push the hardening branch.
10. Update this plan with the commit, verification evidence, and remaining risks.

## Block 0 — Baseline

**Objective:** freeze the real starting state before remediation.

### Steps

1. Record branch, commit, tree, Node, and npm versions.
2. Confirm a clean worktree.
3. Run the test suite, TypeScript checks, production build, dependency audit, and lint availability check.
4. Inventory browser routes, APIs, sensitive environment variables, and QA scenarios.
5. Record known failures without modifying the application.

### Exit gate

The baseline is reproducible and every known failure has an owner block.

### Status

**Completed.** The baseline found 117 test files/853 tests passing, TypeScript passing,
the production build blocked by build-time MongoDB access, four production dependency
findings, and no lint script.

## Block 1 — Build/database boundary

**Objective:** make the production build independent from a live MongoDB instance.

### Steps

1. Mark database-backed App Router pages as runtime/dynamic.
2. Prevent prerendering of blog, garden, laboratory, and admin pages that query MongoDB.
3. Keep the landing shell available when the article preview cannot load.
4. Pass an empty article list to the landing preview on database failure.
5. Keep raw database errors out of the browser.
6. Verify the build with MongoDB unreachable and with MongoDB available.

### Exit gate

`next build` succeeds without MongoDB access, and the landing shell remains usable
when its optional article preview fails.

### Status

**Completed.** Commit `1641b2e` — `fix: decouple build from MongoDB`.

## Block 2 — MongoDB resilience

**Objective:** prevent hangs and permanently cached connection failures.

### Steps

1. Bound server-selection time.
2. Bound initial connection time.
3. Bound socket time.
4. Clear a rejected cached connection promise.
5. Allow a later request to retry after MongoDB recovers.
6. Preserve successful connection reuse.
7. Test initial failure, recovery, retry, and reuse.

### Exit gate

A temporary MongoDB failure returns within a bounded period and does not require
an application restart after recovery.

### Status

**Completed.** Commit `d64215b` — `fix: harden MongoDB connection recovery`.

## Block 3A — Dependency remediation

**Objective:** reduce production dependency exposure without forcing an unreviewed framework migration.

### Steps

1. Identify direct and transitive vulnerable packages.
2. Patch the vulnerable transitive PostCSS version.
3. Patch the vulnerable transitive UUID version.
4. Preserve Next.js 14, React 18, NextAuth 4, and application behavior.
5. Verify lockfile reproducibility with `npm ci`.
6. Re-run tests, typechecks, build, and `npm audit`.
7. Record the remaining Next.js vulnerability as a separate migration decision.

### Exit gate

Transitive findings are removed, lockfile installation is reproducible, and no
breaking framework upgrade is hidden inside the remediation.

### Status

**Completed.** Commit `2b3cb52` — `fix: patch transitive dependency vulnerabilities`.

**Remaining risk:** one high Next.js 14 finding remains. The automated fix requires
Next.js 16.2.11 and must be handled as a separate migration with compatibility testing.

## Block 3B — Lint and CI quality gate

**Objective:** detect static-quality regressions before the build.

### Steps

1. Add Next.js-compatible ESLint configuration.
2. Add `npm run lint`.
3. Fix actionable baseline lint errors without unrelated refactoring.
4. Add lint to GitHub Actions before build completion.
5. Preserve existing tests, typechecks, and build steps.
6. Record non-blocking image optimization warnings separately.

### Exit gate

Lint runs locally and in CI without requiring MongoDB or production secrets.

### Status

**Completed.** Commit `c73901e` — `chore: add lint quality gate`.

## Block 4 — Authentication perimeter

**Objective:** protect public login and registration endpoints from basic abuse.

### Steps

1. Add bounded registration throttling.
2. Add bounded credential-login throttling.
3. Enforce trusted proxy-header handling.
4. Fail closed in production when the proxy/client-address contract is unavailable.
5. Prevent unsafe limiter capacity or unbounded in-memory growth.
6. Enforce registration origin checks.
7. Preserve generic responses that do not reveal account existence.
8. Test normal requests, repeated failures, proxy headers, and production misconfiguration.

### Exit gate

Credential abuse is throttled, production does not silently bypass the perimeter,
and ordinary users are not blocked under normal usage.

### Status

**Completed.** Commit `b807745` — `fix(security): harden auth perimeter`.

## Block 5 — Privileged account assurance

Block 5 is split into two delivered slices.

### Block 5A — Olga provisioning

1. Require validated `MONGODB_URI`, `OLGA_EMAIL`, and `OLGA_PASSWORD`.
2. Remove the localhost MongoDB fallback.
3. Enforce a 12-character minimum password.
4. Use bounded MongoDB timeouts.
5. Explicitly restore the `productora` and `active` state.
6. Guarantee database disconnect cleanup.
7. Test provisioning and recovery without running real provisioning scripts.

**Status:** Completed in `4735754` — `fix(security): harden Olga provisioning`.

### Block 5B — Admin mutation consistency

1. Protect the last active admin invariant.
2. Serialize concurrent privileged mutations with a Mongo lease lock.
3. Assert lease ownership before writes and renewals.
4. Bound Mongo commands and lease operations.
5. Fail safely when an admin is missing or a lease cannot be acquired.
6. Cover role changes, account suspension, provisioning, reset flows, and concurrency.
7. Document the operational requirements and failure modes.

**Status:** Completed in `e01cb81` — `fix(security): guard privileged admin mutations`.

### Block 5 exit gate

Privileged account setup is secret-safe, has no localhost production fallback, and
concurrent mutations cannot remove the last active administrator silently.

## Block 6 — CSRF and mutation-origin policy

**Objective:** prevent cross-origin browser mutations.

### Steps

1. Add a shared Origin validation helper.
2. Compare browser mutation origins with the validated canonical application origin.
3. Reject missing, malformed, and mismatched origins before database work.
4. Apply it to custom `POST`, `PATCH`, and `DELETE` APIs.
5. Keep signed internal account checks separate from browser mutation policy.
6. Test same-origin, cross-origin, malformed, and missing-origin requests.

### Exit gate

An unrelated website cannot use a valid browser session to perform application mutations.

**Status:** Implementation complete; delivery is pending the native review and pre-commit gates for this work unit.

## Block 7 — Runtime input contracts

**Objective:** reject malformed and oversized input before it reaches business logic.

### Steps

1. Validate JSON and content type.
2. Limit request body size.
3. Validate Mongo IDs before repository calls.
4. Validate dates and numeric ranges.
5. Bound text, arrays, image lists, and nested payloads.
6. Validate roles and account states against allowed values.
7. Convert persistence cast errors into stable client errors.
8. Cover registration, articles, plants, oils, formulas, lots, notes, and users.

### Exit gate

Malformed, oversized, or invalid requests receive controlled `4xx` responses and
do not reach database writes.

**Status:** Implemented in the current worktree. The shared runtime boundary covers
JSON content type, a one-megabyte actual byte limit, object roots, bounded values,
strict dates, enums, image URLs, and Mongo ObjectIds. The five custom mutation APIs
and seven browser-reachable laboratory actions reject invalid input before database
access, preserve existing authorization/status allowlists, and normalize persistence
cast/validation failures to stable client errors. Block 8 is documented below.

## Block 8 — Server-action and form resilience

**Status:** Implemented in the current worktree. Block 8 is intentionally separate from
Block 7 and remains limited to server-action/form resilience.

**Objective:** prevent user forms from becoming permanently stuck.

### Steps

1. Wrap async submissions in `try/catch/finally`.
2. Always clear pending state.
3. Return safe user-facing errors.
4. Preserve field-level validation messages.
5. Re-enable controls after rejected actions.
6. Add accessible error announcements.
7. Test database failures and rejected server actions for every laboratory form.

### Contract

- All seven laboratory server actions use one handled failure boundary around authentication,
  database connection, repository lookup, and repository mutation work.
- Existing discriminated result shapes, authorization responses, validation errors, redirects,
  and success results are preserved.
- Persistence-input failures return `Entrada inválida`; unexpected authentication, connection,
  and repository failures return stable retryable messages and never expose backend error details.
- Formula, lot, and notes controls catch rejected submissions and always settle their pending or
  disabled state. Notes forms also announce rejected server-action promises safely.
- Login, registration, and article creation announce errors accessibly. User-management mutations
  prevent concurrent submissions and announce safe failures. `content-actions.tsx` behavior remains
  unchanged.

### Exit gate

Every failed submission leaves the form retryable without a page reload.

### Status

**Implemented in the current worktree.** Focused action and form tests cover connection/authentication
rejections, raw backend-message redaction, pending-state recovery, accessible announcements, and
field-error associations. Block 9 remains explicitly pending.

## Block 9 — Loading and error boundaries

**Status:** Completed. Commit `9103965` — `fix(resilience): add loading and error boundaries`.

**Objective:** make database and runtime failures recoverable in the browser.

### Steps

1. Add root loading and error states.
2. Add route-group states for blog, garden, laboratory, and admin.
3. Add retry controls.
4. Add missing not-found states where needed.
5. Keep stack traces, IDs, and secrets out of rendered output.
6. Verify keyboard accessibility and mobile presentation.

### Exit gate

Dependency outages show a safe recovery screen rather than a blank page or raw framework error.

### Delivery evidence

- Added root and route-group loading, error, and not-found boundaries for blog, garden, laboratory,
  and admin, plus a global error recovery boundary.
- Added safe reusable recovery components with retry controls and accessible responsive presentation.
- Verified focused boundary tests (18 passed), full tests (133 files, 989 tests passed), TypeScript,
  lint, and production build.
- Native review `review-82a8bc52a58a4ff9` approved; pre-commit and pre-push gates allowed.
- Remaining warnings are the existing non-blocking image optimization warnings from lint/build.

## Block 10 — Public health contracts

**Status:** Completed. Commit `fe63e10` — `feat(health): add public liveness and readiness probes`.

**Objective:** provide safe liveness and readiness endpoints for future Coolify use.

### Steps

1. Add unauthenticated `/api/health/live`.
2. Add unauthenticated `/api/health/ready`.
3. Keep liveness independent from MongoDB.
4. Make readiness check required configuration and MongoDB.
5. Bound probe time.
6. Return minimal bodies without secrets or topology details.
7. Keep detailed health reporting admin-only.

### Exit gate

The platform can distinguish a running process from a ready application without
exposing internal information.

### Delivery evidence

- Added unauthenticated `/api/health/live` and `/api/health/ready` endpoints with minimal
  no-store responses, bounded readiness checks, and explicit dynamic rendering.
- Kept detailed admin health reporting private and hardened timed-out Mongo probe cleanup.
- Verified focused health tests (10 passed), full suite (996 tests passed), TypeScript, lint,
  and production build.
- Native review `review-54e514c72ff66cef` approved; pre-commit and pre-push gates allowed.
- Existing non-blocking image optimization warnings remain in lint/build output.

## Block 11 — Local and production MongoDB contract

**Status:** Completed in the current worktree; delivery evidence is recorded below.

**Objective:** prevent local database settings from leaking into production.

### Steps

1. Keep local MongoDB bound to loopback.
2. Add local authentication without committing credentials.
3. Remove production localhost fallbacks.
4. Document local, Coolify, and external MongoDB configurations separately.
5. Record the retained lease-lock and compensating-rollback topology contract; defer true multi-document transactions.

### Exit gate

Local MongoDB is private and authenticated, while production cannot silently use local defaults.

### Delivery evidence

- The shared MongoDB resolver now requires a valid explicit `MONGODB_URI` in every runtime, preserves authenticated URI values, and rejects missing or invalid configuration before connecting.
- `check-articles.ts`, `check-users.ts`, and `seed-plants.ts` reuse the shared connector, contain no localhost URI fallback, and do not print URIs, credentials, password hashes, or raw Mongo errors.
- Local Compose MongoDB remains host-loopback-only and requires substituted root credentials. Existing unauthenticated `mongo-data` volumes are not auto-upgraded; the runbook documents verified backup, fresh authenticated volume, and restore precautions.
- `.env.example`, `docs/runbook.md`, and `docs/scripts.md` separate local authenticated, Coolify/private, and external managed MongoDB contracts, including URL encoding and `authSource` guidance.
- The existing privileged mutation topology remains Mongo lease locking plus compensating rollback. True multi-document transactions are a separate future change; a replica set alone is not sufficient for the current code.
- Focused tests cover URI validation/preservation, script fallback and logging policy, loopback binding, authentication placeholders, and documentation consistency.

## Block 12 — Asset and navigation integrity

**Status:** Completed. Commit `bc4560f` — `fix(ui): harden asset and navigation integrity`.

**Objective:** eliminate broken browser-visible assets and links.

### Steps

1. Detect missing local asset paths.
2. Replace the missing plant placeholder safely.
3. Verify every internal link and redirect.
4. Remove example or fabricated URLs.
5. Preserve only approved persisted plant image URLs.
6. Verify graceful behavior when remote images fail.
7. Verify alt text and responsive layout.

### Exit gate

The browser-visible application contains no known broken local asset or internal route.

### Delivery evidence

- Removed unapproved Stitch/AIDA image URLs and the missing plant placeholder path without adding
  arbitrary replacement assets.
- Added resilient image fallback behavior, preserved plant image curation policy, and restored
  article image alt text in the landing diary.
- Verified focused Block 12 tests (58 passed), full suite (1,018 tests passed), TypeScript,
  script typecheck, lint, and production build.
- Native review `review-5c1a2081a18404de` approved; pre-commit and pre-push gates allowed.
- Remaining warnings are non-blocking image/lint and unavailable-Mongo build warnings.

## Block 13 — Documentation reconciliation

**Objective:** make operational documentation match the implemented application.

### Steps

1. Reconcile README routes.
2. Reconcile runbook commands and environment variables.
3. Document auth, health, MongoDB, backups, and rollback contracts.
4. Mark deferred features explicitly.
5. Keep product decisions in the platform context document and operations in the runbook.

### Exit gate

A clean checkout can be understood and verified without undocumented assumptions.

## Block 14 — Browser QA gate

**Objective:** verify every user-visible flow against a local production server.

### Scenarios

- Anonymous landing, login, registration, links, assets, 404s, mobile, and desktop.
- Subscriber blog, articles, garden, plant details, session expiry, and database outage.
- Olga laboratory formulas, lots, notes, follow-ups, validation failures, and forbidden admin access.
- Admin users, roles, suspensions, content lifecycle, botanical catalog, and private health.
- Security: invalid credentials, throttling, invalid payloads, origin rejection, direct API access,
  callback URL handling, and suspended sessions.

### Exit gate

The complete matrix passes against a local production build, with no stuck forms or unauthorized mutation.

## Block 15 — Backup, observability, and rollback

**Objective:** define recovery before any VPS change.

### Steps

1. Define MongoDB backup frequency and retention.
2. Store backups outside the VPS.
3. Perform and record a restore rehearsal.
4. Define logs, redaction, correlation, and alerts.
5. Define application rollback to a known release.
6. Define database compatibility and restore rules.
7. Define RPO/RTO and rollback authorization.

### Exit gate

The application and database can be recovered through documented, rehearsed procedures.

## Block 16 — Coolify/VPS deployment

**Objective:** perform the first controlled deployment only after application readiness is approved.

### Steps

1. Confirm Blocks 0–15 are complete.
2. Configure the Coolify application.
3. Create or connect a private MongoDB service.
4. Configure production secrets.
5. Configure domain, TLS, resources, and healthchecks.
6. Keep MongoDB port `27017` private.
7. Configure persistent storage and verified backups.
8. Deploy a known release identifier.
9. Repeat the browser QA matrix.
10. Inspect logs and health endpoints.
11. Perform the documented rollback test.

### Exit gate

The application starts with valid production configuration, becomes ready only when
MongoDB is reachable, keeps MongoDB private, and can be rolled back safely.

## Explicit non-goals

- No e-commerce functionality.
- No forced Google OAuth activation.
- No arbitrary or invented image assets.
- No Coolify/VPS changes before the final deployment block.
- No blind Next.js major upgrade; that requires its own migration plan and approval.
