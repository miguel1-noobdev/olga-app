# Tasks: Identity and Access

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 2,900–3,800 |
| 800-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | force-chained |
| Chain strategy | feature-branch-chain — the integration/tracker branch accumulates the release; PR #1 targets the tracker, then each child PR targets the immediate prior child branch. |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Primitives + dry-run | 1, ≤800; base = tracker | `npm test -- identity-foundation` | `--dry-run` receipt | New models/repos/script |
| 2 | Verified registration | 2, ≤800; branch = `feat/identity-access-unit-2-registration`; base = `feat/identity-access-unit-1-foundation` | `npm test -- registration` | Mailpit captures registration mail; no external delivery | Registration/verify/resend/email/proxy controls |
| 3 | Recovery + access | 3, ≤800; base = `feat/identity-access-unit-2-registration` | `npm test -- account-access` | stale-session/reset HTTP | Recovery/access/auth checks |
| 4 | Google/linking | 4, ≤800; base = PR 3 branch | `npm test -- google-linking` | disabled/proof flow | Provider/linking only |
| 5 | Migration hardening | 5, ≤800; base = PR 4 branch | `npm test -- identity-migration` | apply rehearsal receipt | Migration/config/runbook |

**Delivery:** the tracker accumulates the release; PR #1 targets the tracker, PR #2 (`feat/identity-access-unit-2-registration`) targets `feat/identity-access-unit-1-foundation`, and each later child targets its immediate prior child branch. **Unit 2 transport:** temporary Gmail SMTP sender `esenciales.ob@gmail.com`; Mailpit is test-only and never delivers externally; the Gmail app password is VPS-only and never source-controlled. Unit 1 is autonomous and credential-free; Google approval remains a Unit 4 blocker.

## Phase 1: Foundation and Dry Run

- [x] 1.1 RED: add `tests/unit/auth-token.test.ts` for hash, expiry, replay, atomic consume; add migration dry-run role-preservation coverage.
- [x] 1.2 GREEN: create `src/lib/db/models/{identity,auth-token,rate-limit,auth-event}.ts`; add status and `securityVersion` to `user.ts`/`repository/user.ts`.
- [x] 1.3 GREEN: create `scripts/identity-migration.ts --dry-run` receipt; forbid apply before receipt review/sign-off.
- [x] 1.4 REFACTOR: record Unit 1 receipt, test result, ordering, and model/script rollback boundary.

## Phase 2: Verified Registration

- [x] 2.1 RED: add `tests/{unit,email,http}/**` for absent/invalid runtime SMTP fail-closed, Mailpit-only no-external delivery, 5 normalized-email/hour, 20 trusted-IP/hour, and local-Nginx-only forwarded IP; retain pending/generic/rotation/no-session cases.
- [x] 2.2 GREEN: add `src/lib/email/{sender,config,templates}.ts`, `src/lib/auth/client-ip.ts`, and registration routes using VPS-only Gmail SMTP `esenciales.ob@gmail.com`; fail closed, route tests through Mailpit, enforce 5/20 rolling limits and local-Nginx forwarding trust.
- [x] 2.3 GREEN: update `src/lib/auth/{options,authorize-credentials,types}.ts`, auth UI, `.env.example`, `src/proxy.ts`, and `ops/nginx/botanicasob.conf` for pending verification plus runtime SMTP validation, Mailpit isolation, 5/20 keys, and local-Nginx-only forwarding; document names only, never the app password.
- [x] 2.4 REFACTOR: receipt-review Unit 2's SMTP fail-closed, Mailpit-only, 5/20, and trusted-proxy evidence; disable routes/config to roll back without roles or secrets.

> Evidence reconciliation: the Phase 2 candidate also contains a one-line change to `src/app/api/auth/account-access/route.ts` and its companion test, exposing `emailVerified` to the persisted-account check used by `src/proxy.ts`. This is a Phase 2 compatibility change supporting pending-verification enforcement, not Phase 3 recovery or revocation work.

## Phase 3: Recovery, Revocation, and Access

> Scope clarification: `src/app/api/auth/account-access/route.ts` is listed in task 3.2 for the future recovery/access slice, but the Phase 2 candidate's disclosed one-line compatibility extension does not satisfy or complete task 3.2. Task 3.2 remains pending.

- [ ] 3.1 RED: add tests for generic recovery, reset replay, staff role preservation, stale JWT, suspended access, and `/blog` return URLs.
- [ ] 3.2 GREEN: create recovery/change routes and `scripts/staff-account-recovery.ts`; update `current-user.ts`, `src/proxy.ts`, and `account-access/route.ts`.
- [ ] 3.3 REFACTOR: receipt-review invalidation; roll back routes/checks while preserving roles/audit records.

## Phase 4: Google Linking

- [ ] 4.1 RED: add `tests/http/google-linking.test.ts`: disabled config, verified subscriber, existing identity, ambiguous-email denial.
- [ ] 4.2 GREEN: wire `src/lib/auth/options.ts` and `link-google/route.ts` only after approved proof UX; never merge silently.
- [ ] 4.3 REFACTOR: receipt-review provider flag; rollback by disabling Google/linking without touching accounts or roles.

## Phase 5: Apply, Audit, and Release Hardening

- [ ] 5.1 RED: cover apply receipts, proxy failure, generic limits, and token-free audits in migration/limit/audit tests.
- [ ] 5.2 GREEN: update `.env.example`, `rate-limit.ts`, `auth-event.ts`, and migration runbook with approved SMTP/proxy values.
- [ ] 5.3 REFACTOR: receipt-review dry-run then apply; rehearse route/provider disable and token/session invalidation, never roles.
