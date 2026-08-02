# Apply Progress: Identity and Access Units 1–2

## Status

Unit 1 (Phase 1: Foundation and Dry Run) and Unit 2 (Phase 2: Verified Registration) are complete in Strict TDD mode. This slice is on `feat/identity-access-unit-2-registration`, targeting the immediate parent `feat/identity-access-unit-1-foundation`. The native Unit 2 ledger recorded 838 authored lines; the maintainer explicitly accepted `size:exception` for this evidence-only reconciliation. No commit, push, PR, review, deployment, migration apply, or attempt-lifecycle operation was performed. The temporary Mailpit container used by the runtime harness was stopped after verification.

## Completed Tasks

- [x] 1.1 RED: Added token and migration dry-run tests before the corresponding production code.
- [x] 1.2 GREEN: Added identity, auth-token, rate-limit, and auth-event models; extended user lifecycle/version persistence and repository operations.
- [x] 1.3 GREEN: Added a read-only `--dry-run` migration receipt and an apply guard requiring reviewed receipt sign-off.
- [x] 1.4 REFACTOR: Recorded ordering, evidence, and rollback boundary below.
- [x] 2.1 RED: Added SMTP fail-closed, Mailpit isolation, pending-registration, generic-response, rotation, no-session, rate-limit, and trusted-proxy tests before Unit 2 production changes.
- [x] 2.2 GREEN: Added runtime-only SMTP email delivery, verification/resend routes, pending-account flow, durable 5/20 rolling limits, and local-Nginx client-IP trust.
- [x] 2.3 GREEN: Added verification/security-version auth claims, pending verification UI status, runtime variable documentation, and Nginx forwarding contract.
- [x] 2.4 REFACTOR: Completed focused/runtime evidence and recorded the Unit 2 rollback and attempt-settlement boundary below.

### Unit 2 Scope Reconciliation

Read-only Git and CodeGraph evidence confirms that the candidate includes a one-line compatibility change in `src/app/api/auth/account-access/route.ts` and its companion test. The change exposes `emailVerified` to the persisted-account check consumed by `src/proxy.ts`, supporting Phase 2's pending-verification enforcement. It is disclosed here as a Phase 2 support change only; it does not implement Phase 3 recovery, revocation, or staff-access behavior. Phase 3 task 3.2 remains pending.

## Implementation Ordering

1. RED tests were written in `tests/unit/auth-token.test.ts` for token hashing, expiry, replay, atomic consumption, migration role preservation, model indexes/defaults, and security-version advancement.
2. GREEN production code added the four new Mongoose models and extended `UserModel`/`UserRepository` without changing the existing active-account default.
3. GREEN migration code added deterministic receipt creation, explicit sign-off validation, database dry-run loading, and a credential-free stdin harness.
4. REFACTOR removed the Mongoose deprecation warning by using `returnDocument: 'after'` and lazy-loaded database-only CLI dependencies so the stdin dry run runs without a database connection.

## TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `tests/unit/auth-token.test.ts` | Unit + Mongo integration | N/A (new test file) | Written before implementation; initial run failed on missing production modules | 9/9 focused tests passed | Hash, expiry, replay, concurrent claims, and migration cases | Clean; final focused run remained green |
| 1.2 | `tests/unit/auth-token.test.ts`, `tests/user-repository.test.ts` | Unit + Mongo integration | `tests/user-repository.test.ts`: 19/19 before edits | Schema/repository contracts written before model changes; security-version method test later failed until implemented | 9/9 foundation tests and 19/19 repository tests passed | Provider uniqueness, TTL index, lifecycle defaults, pending status, and atomic version increment | Clean; existing repository behavior preserved |
| 1.3 | `tests/unit/auth-token.test.ts` | Unit + runtime script | N/A (new script) | Receipt/sign-off tests written before script implementation | 9/9 focused tests passed | Legacy admin plus already-migrated productora inputs; reviewed and unreviewed receipt paths | Clean; stdin runtime path avoids database dependency |
| 1.4 | `openspec/changes/identity-access/apply-progress.md` | Receipt/documentation | N/A | N/A — evidence artifact | N/A — artifact records completed behavior | N/A — receipt includes ordering and rollback scope | Complete; evidence digest recorded by executor response |

## Work Unit Evidence

| Evidence | Exact result |
|---|---|
| Focused test command | `npm test -- --run tests/unit/auth-token.test.ts tests/user-repository.test.ts` → exit 0; 2 test files passed; 28 tests passed. |
| Script typecheck | `npm run typecheck:scripts` → exit 0. |
| Runtime dry-run harness | `printf '[{"id":"legacy-admin","email":"admin@example.test","role":"admin"},{"id":"legacy-productora","email":"olga@example.test","role":"productora","accountStatus":"active","securityVersion":2}]\n' \| node --experimental-strip-types scripts/identity-migration.ts --dry-run --stdin` → exit 0; receipt emitted with `sourceCount: 2`, one proposed active/version-zero change for `legacy-admin`, unchanged `admin` role, and `rolePreservation: true`. |
| Apply guard harness | `node --experimental-strip-types scripts/identity-migration.ts --apply` → exit 1; `guard=review-signoff-required`. |
| Rollback boundary | Revert only `tests/unit/auth-token.test.ts`, `src/lib/db/models/{identity,auth-token,rate-limit,auth-event}.ts`, `src/lib/db/models/user.ts`, `src/lib/db/repository/user.ts`, and `scripts/identity-migration.ts` plus this change's progress artifacts; this removes Unit 1 primitives/dry-run behavior without touching unrelated application behavior or roles. |

## Unit 2 Implementation Ordering

1. RED tests were written for runtime SMTP validation, verification templates, client-IP trust, exact 5/20 rolling limits, pending registration, generic responses, token rotation/replay, no pre-verification authorization, verification-link redirects, JWT lifecycle claims, UI guidance, persisted verification enforcement, and Nginx forwarding.
2. GREEN production code added the SMTP sender/configuration/templates, registration service, verification and resend routes, durable limits, client-IP helper, pending-account persistence/verification, and lifecycle claims.
3. GREEN route tests confirmed pending `suscriptora` creation, no session before verification, activation after one valid token, replay rejection, resend rotation, generic unknown-address handling, and SMTP failure without activation.
4. REFACTOR removed dynamic token imports, used `returnDocument: 'after'` for new atomic updates, isolated Mailpit runtime transport behavior, and aligned admin directory types with the new `pending_email` lifecycle state.

## Unit 2 TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 2.1 | `tests/unit/{email-config,client-ip,rate-limit}.test.ts`, `tests/http/verified-registration.test.ts` | Unit + HTTP/Mongo integration | Existing auth/register/middleware/Nginx tests: 60/60 passed | Missing email/client-IP/rate-limit modules and pending route behavior failed before implementation | 13 files / 76 focused tests passed in final slice | SMTP absent/valid, trusted/untrusted IP, 5/20 boundaries, expired window, pending/verified/replay, resend/unknown, delivery failure | Clean; rate limit uses durable model and fail-closed responses |
| 2.2 | `tests/http/verified-registration.test.ts`, `tests/email/mailpit-runtime.test.ts` | HTTP + SMTP runtime | New route tests; Unit 1 foundation remained green | Routes/sender were absent; pending and delivery scenarios failed | Registration/verification/resend scenarios passed; Mailpit capture passed | New registration, replay, rotation, unknown email, SMTP rejection | Clean; raw token only appears in URL/message body, no provider error returned |
| 2.3 | `tests/auth-options-claims.test.ts`, `tests/login-verification-status.test.tsx`, `tests/api-auth-account-access.test.ts`, `tests/middleware.test.ts`, `tests/nginx-config.test.ts`, `tests/admin-users-role-change.test.ts` | Unit + component + topology | Auth/UI/Nginx baseline included in 60/60 safety net | JWT and persisted-verification tests failed before their claims/checks were restored | 6 files / 44 claim/UI/access/topology tests passed | Registered, verified, pending, and untrusted forwarding states | Clean; admin projection preserves pending lifecycle without allowing pending status mutation |
| 2.4 | `openspec/changes/identity-access/apply-progress.md` | Receipt/documentation | N/A — evidence artifact | N/A — receipt task | N/A — artifact records completed behavior | Focused, runtime, full-suite, build, typecheck, and diff evidence recorded | Complete; exact rollback and settlement recommendation recorded |

## Unit 2 Work Unit Evidence

| Evidence | Exact result |
|---|---|
| Focused test command | `npm run test:run -- tests/unit/email-config.test.ts tests/unit/client-ip.test.ts tests/unit/rate-limit.test.ts tests/http/verified-registration.test.ts tests/api-auth-register.test.ts tests/auth-options-authorize.test.ts tests/auth-options-claims.test.ts tests/api-auth-account-access.test.ts tests/middleware.test.ts tests/nginx-config.test.ts tests/admin-users-role-change.test.ts tests/login-verification-status.test.tsx tests/email/mailpit-runtime.test.ts` → exit 0; 13 files passed; 76 tests passed. |
| Runtime harness command/scenario | Started `axllent/mailpit:latest` as `olga-identity-unit-2-mailpit` on loopback ports 1025/8025; `curl -fsS -X DELETE http://127.0.0.1:8025/api/v1/messages` then `npm run test:run -- tests/email/mailpit-runtime.test.ts` → exit 0; 1 file and 1 test passed; sender `esenciales.ob@gmail.com` captured locally and no external provider was contacted. Container stopped after the run. |
| Typecheck | `npx tsc --noEmit` → exit 0 after removing stale malformed ignored `.next/dev/types` artifacts and correcting the claim-test fixture types. |
| Build | `npm run build` → exit 0; Next.js compiled, typechecked, generated 18 static pages, and listed `/api/auth/register`, `/api/auth/resend`, and `/api/auth/verify`. |
| Full suite | `npm run test:run` → 138 of 140 files passed, 943 tests passed; 2 unrelated failures: the pre-existing `tests/scripts/pm2-activation.test.ts` stale hard-coded release SHA and a transient `tests/plant-model.test.ts` MongoMemoryServer port collision. Rerun `npm run test:run -- tests/plant-model.test.ts` → 1 file / 8 tests passed. Unit 2 focused tests are green; neither unrelated failure was modified. |
| Diff hygiene | `git diff --check` → exit 0. No source-mutating formatter/normalizer is configured in `package.json` or `openspec/config.yaml`. |
| Rollback boundary | Revert only Unit 2 paths: `src/lib/email/`, `src/lib/auth/{client-ip,rate-limit,registration}.ts`, `src/app/api/auth/{register,resend,verify}/`, `src/app/api/auth/account-access/route.ts`, lifecycle/auth/UI edits in `src/lib/{db/repository/user.ts,auth/{authorize-credentials,options,types.d.ts}}` and `src/components/auth/{login-form,register-form}.tsx`, `.env.example`, `ops/nginx/botanicasob.conf`, associated Unit 2 tests including `tests/api-auth-account-access.test.ts`, and this progress/tasks artifact. This disables registration delivery/verification and trusted limits without changing roles, secrets, or Unit 1 primitives. |

## Unit 2 Attempt Settlement Recommendation

- **Outcome**: Recommend `success` for `unit-2-verified-registration` with the explicitly accepted `size:exception`; all assigned tasks, focused tests, Mailpit runtime harness, build, typecheck, and diff checks passed before this evidence-only reconciliation.
- **Native attempt**: `sha256:a264f72655b5f26c51ead9ec305315fc4a702d7ab0cb84f7c1da7fd631cdff47` (acquired; lifecycle remains owned by the parent).
- **Evidence revision**: `sha256:053141997c8009ef6694609840a2d746adf1da87adaa57c166fafc2a76efb8d8` over the Unit 2 verification tuple (focused 13/76, Mailpit 1/1, typecheck pass, build pass, full 140/943 with two unrelated failures, PM2 stale-SHA diagnosis, plant-model rerun 8/8, diff-check pass, Mailpit stopped).
- **Diagnosis**: `none` for Unit 2; full-suite has the pre-existing `tests/scripts/pm2-activation.test.ts` stale expected release SHA `b050790d8dc7ab9638dd74217c18cd770043401f` and one transient MongoMemoryServer port collision in unrelated `tests/plant-model.test.ts`, which passed on focused rerun.
- **Harness disposition**: Mailpit-only harness passed on loopback; no Gmail connection or credentials were used; `olga-identity-unit-2-mailpit` was stopped after verification.
- **Cleanup**: no commits, pushes, PRs, native review, attempt lifecycle calls, external email, or other-worktree changes; generated build/cache output remains ignored.
- **Process evidence**: branch `feat/identity-access-unit-2-registration` targets `feat/identity-access-unit-1-foundation`; native ledger recorded 838 authored lines, the explicit `size:exception` is accepted for this reconciliation, and Phase 3+ tasks were not implemented. The candidate's one-line `account-access/route.ts` response extension is the disclosed Phase 2 compatibility change described above.

## Receipt — Unit 1 Foundation

- Work unit: `unit-1-foundation`
- Goal: `identity-foundation-dry-run`
- Runtime ledger request: `identity-access-unit-1-20260731`
- Runtime ledger revision: `sha256:4edbf09afb42147bde3e995707812f5e5bfa20bf47a2e20c58a838c28f628ce5`
- Delivery: force-chained feature-branch-chain, PR slice 1, under the 800-line slice limit.
- Migration policy: dry-run is read-only; apply is forbidden until the exact receipt has been reviewed and explicitly signed off.
- Credentials/services: none used.

## Receipt — Unit 2 Verified Registration

- Work unit: `unit-2-verified-registration`
- Goal: `identity-verified-registration`
- Native attempt: `sha256:a264f72655b5f26c51ead9ec305315fc4a702d7ab0cb84f7c1da7fd631cdff47`
- Delivery: force-chained feature-branch-chain, PR slice 2, with an explicitly accepted `size:exception` for the native 838-line result.
- Source scope: Unit 2 registration, verification, resend, email, proxy-trust, lifecycle-claim, and associated test changes; includes the disclosed one-line `account-access/route.ts` compatibility response extension and its test. No Phase 3 recovery/revocation implementation is claimed.
- Settlement: recommend `success` for the evidence-only attempt; the parent owns any attempt-lifecycle settlement operation.
- Credentials/services: none used during this reconciliation.

## Remaining Tasks

Phase 1 and Phase 2 are complete. Phase 3+ remains pending and out of scope for this slice.

## Transition Contract

- `next_recommended: sdd-apply`
- Next scope: Unit 3 — Recovery, Revocation, and Access, after parent settlement and review.
- Hard prerequisite: Unit 2 focused/runtime evidence and the pre-existing PM2 test failure must be carried into verification context.
- Final `sdd-verify` is blocked until all 17 tasks are complete.
