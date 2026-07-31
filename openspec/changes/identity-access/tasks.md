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
| 2 | Verified registration | 2, ≤800; base = PR 1 branch | `npm test -- registration` | fake-sender registration | Registration/verify/resend |
| 3 | Recovery + access | 3, ≤800; base = PR 2 branch | `npm test -- account-access` | stale-session/reset HTTP | Recovery/access/auth checks |
| 4 | Google/linking | 4, ≤800; base = PR 3 branch | `npm test -- google-linking` | disabled/proof flow | Provider/linking only |
| 5 | Migration hardening | 5, ≤800; base = PR 4 branch | `npm test -- identity-migration` | apply rehearsal receipt | Migration/config/runbook |

**Delivery:** the tracker accumulates the release; PR #1 targets the tracker, and every later child PR targets its immediate prior child branch. **Blockers:** approve SMTP/domain, proxy, and limits before enabling Unit 2; approve Google flag and linking proof UX before Unit 4. Unit 1 is autonomous and credential-free.

## Phase 1: Foundation and Dry Run

- [x] 1.1 RED: add `tests/unit/auth-token.test.ts` for hash, expiry, replay, atomic consume; add migration dry-run role-preservation coverage.
- [x] 1.2 GREEN: create `src/lib/db/models/{identity,auth-token,rate-limit,auth-event}.ts`; add status and `securityVersion` to `user.ts`/`repository/user.ts`.
- [x] 1.3 GREEN: create `scripts/identity-migration.ts --dry-run` receipt; forbid apply before receipt review/sign-off.
- [x] 1.4 REFACTOR: record Unit 1 receipt, test result, ordering, and model/script rollback boundary.

## Phase 2: Verified Registration

- [ ] 2.1 RED: add `tests/http/{register,verify,resend}.test.ts`: pending-only, generic unknown/duplicate, rotation, SMTP failure, no session.
- [ ] 2.2 GREEN: add `src/lib/email/{sender,config,templates}.ts` and routes; fail closed without approved SMTP/domain/proxy/limits.
- [ ] 2.3 GREEN: update `src/lib/auth/{options,authorize-credentials,types}.ts` and auth UI for pending/verification.
- [ ] 2.4 REFACTOR: receipt-review; disable Unit 2 routes/config to roll back without role changes.

## Phase 3: Recovery, Revocation, and Access

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
