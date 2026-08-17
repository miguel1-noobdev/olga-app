# Apply Progress: Identity and Access Units 1–5 plus Amendment Slice 1

## Status

Unit 1 (Phase 1: Foundation and Dry Run), Unit 2 (Phase 2: Verified Registration), Unit 3 (Phase 3: Recovery, Revocation, and Access), Unit 4 (Phase 4: Google Linking), and Unit 5 (Phase 5: Apply, Audit, and Release Hardening) remain complete in Strict TDD mode. Amendment Slice 1 is uncommitted on `feat/identity-access-01-provider-first-collision`, based on `feat/identity-access-unit-5-hardening` under the approved `auto-chain`/`feature-branch-chain` strategy. Tests use fake configuration, MongoMemoryServer, and mocked NextAuth callbacks only; no external Google OAuth call or credential was used.

## Completed Tasks

- [x] 1.1 RED: Added token and migration dry-run tests before the corresponding production code.
- [x] 1.2 GREEN: Added identity, auth-token, rate-limit, and auth-event models; extended user lifecycle/version persistence and repository operations.
- [x] 1.3 GREEN: Added a read-only `--dry-run` migration receipt and an apply guard requiring reviewed receipt sign-off.
- [x] 1.4 REFACTOR: Recorded ordering, evidence, and rollback boundary below.
- [x] 2.1 RED: Added SMTP fail-closed, Mailpit isolation, pending-registration, generic-response, rotation, no-session, rate-limit, and trusted-proxy tests before Unit 2 production changes.
- [x] 2.2 GREEN: Added runtime-only SMTP email delivery, verification/resend routes, pending-account flow, durable 5/20 rolling limits, and local-Nginx client-IP trust.
- [x] 2.3 GREEN: Added verification/security-version auth claims, pending verification UI status, runtime variable documentation, and Nginx forwarding contract.
- [x] 2.4 REFACTOR: Completed focused/runtime evidence and recorded the Unit 2 rollback and attempt-settlement boundary below.
- [x] 3.1 RED: Added generic-recovery, reset-replay, staff-preservation, stale-session, suspended-access, and safe-blog-return-url tests before the Unit 3 production changes.
- [x] 3.2 GREEN: Added password recovery/change routes, hashed expiring reset tokens, security-version revocation, persisted access checks, and the staff recovery runbook.
- [x] 3.3 REFACTOR: Reviewed the invalidation and rollback boundary; evidence preserves roles and audit records and keeps Unit 4/5 untouched.
- [x] 4.1 RED: Added Google provider-policy and HTTP linking tests before Unit 4 production changes, covering disabled configuration, tokenized proof, identity conflicts, verified new subscribers, existing identities, and ambiguous email denial.
- [x] 4.2 GREEN: Added explicit release-gated Google provider activation, verified-profile handling, role-preserving identity sign-in, suscriptora-only new OAuth accounts, and the authenticated two-step `link-google` proof route.
- [x] 4.3 REFACTOR: Reviewed provider-flag and identity rollback; disabling `GOOGLE_OAUTH_ENABLED` removes provider/linking availability without mutating accounts, identities, roles, or credentials.
- [x] 5.1 RED: Added migration apply/receipt-integrity, proxy fail-closed, approved-limit, and token-free audit tests before the hardening implementation.
- [x] 5.2 GREEN: Added reviewed migration apply with role guards, canonical 5/20 rolling-hour defaults and denial audits, hashed/sanitized audit events, runtime proxy marker configuration, approved environment values, and migration/rollback runbook instructions.
- [x] 5.3 REFACTOR: Rehearsed credential-free dry-run/apply guard and MongoMemoryServer apply behavior; reviewed provider/route disable and token/session invalidation rollback without role mutation.

### Unit 2 Scope Reconciliation

Read-only Git and CodeGraph evidence confirms that the candidate includes a one-line compatibility change in `src/app/api/auth/account-access/route.ts` and its companion test. The change exposes `emailVerified` to the persisted-account check consumed by `src/proxy.ts`, supporting Phase 2's pending-verification enforcement. It is disclosed here as a Phase 2 support change only; it does not implement Phase 3 recovery, revocation, or staff-access behavior. Phase 3 task 3.2 is complete in Unit 3; Unit 4 and Unit 5 are complete in their respective slices.

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

At the Unit 2 completion point, Phase 1, Phase 2, Phase 3, and Phase 4 were complete and Phase 5 remained pending; Unit 5 now completes that final phase in this slice.

## Unit 3 Implementation Ordering

1. RED tests were written for generic known/unknown recovery responses, durable recovery limits, reset replay rejection, authenticated staff password changes, stale security versions, persisted account-version responses, and staff-role recovery before adding the recovery implementation.
2. GREEN production code added `recovery.ts`, password reset/change routes, password hashing persistence, recovery email templates, session/token invalidation, and the staff-account recovery script. `current-user.ts`, `src/proxy.ts`, and `account-access/route.ts` now fail closed on persisted status, verification, and security-version drift.
3. TRIANGULATE tests covered both successful and denied staff recovery, replayed reset tokens, generic unknown-address handling, rate-limit denial, suspended-session denial, stale JWT denial, and safe `/blog` callback preservation.
4. REFACTOR review confirmed that recovery mutates only password/security-version/token state, preserves role and lifecycle status, records redacted audit events, and can be rolled back by disabling/reverting the Unit 3 routes and checks without deleting roles or audit records.

## Unit 3 TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 3.1 | `tests/http/account-recovery.test.ts`, `tests/current-user.test.ts`, `tests/api-auth-account-access.test.ts`, `tests/middleware.test.ts` | Unit + HTTP contract | Existing Unit 1/2 auth/access baseline: 80/80 passed | New route and stale-version assertions failed before routes/checks existed | 5 files / 44 focused tests passed | Known/unknown, replay, rate-limit, staff change, suspended, stale JWT, persisted version, `/blog` return URL | Clean; assertions remain behavior-focused |
| 3.2 | `src/app/api/auth/*password*/route.ts`, `tests/http/role-access.test.ts`, `tests/unit/staff-account-recovery.test.ts` | HTTP + Mongo integration | Existing repository/token tests remained green | Route imports and missing recovery behavior failed before implementation | Runtime reset/replay/stale-session path passed; staff repository contract passed | Subscriber/admin staff roles, active/suspended state preservation, one-time token, session version advancement | Clean; recovery is isolated in a reusable service |
| 3.3 | `openspec/changes/identity-access/apply-progress.md` | Receipt/documentation | N/A — evidence artifact | N/A — receipt-review task | N/A — no new behavior; implementation evidence recorded | N/A — rollback and audit-preservation boundary reviewed | Complete; Unit 3 evidence digest recorded below |

## Unit 3 Work Unit Evidence

| Evidence | Exact result |
|---|---|
| Focused test command | `npm run test:run -- tests/http/account-recovery.test.ts tests/unit/staff-account-recovery.test.ts tests/current-user.test.ts tests/api-auth-account-access.test.ts tests/middleware.test.ts tests/unit/auth-token.test.ts tests/user-repository.test.ts tests/sanitize-callback-url.test.ts` → exit 0; 9 files passed; 88 tests passed. |
| Runtime harness command/scenario | `npm run test:run -- tests/http/role-access.test.ts` → exit 0; 1 file and 6 tests passed. The real Next.js HTTP flow signed in a `productora`, reset its password with a one-time token, rejected replay, denied the stale pre-reset session at `/blog`, and accepted a fresh session with the preserved staff role. |
| Full serial suite | `npm run test:run` with loopback Mailpit on `127.0.0.1:1025/8025` → exit 0; 145 files passed; 963 tests passed; no external email credentials used. |
| Typecheck | `npx tsc --noEmit` → exit 0. |
| Script typecheck | `npm run typecheck:scripts` → exit 0. |
| Build | `npm run build` → exit 0; Next.js compiled and listed `/api/auth/change-password`, `/api/auth/forgot-password`, and `/api/auth/reset-password`. |
| Diff hygiene | `git diff --check` → exit 0; 800 total authored changed lines (additions plus deletions across source, tests, and cumulative OpenSpec evidence), exactly at the 800-line work-unit ceiling. |
| Rollback boundary | Revert/disable only `src/app/api/auth/{forgot-password,reset-password,change-password}/route.ts`, `src/lib/auth/recovery.ts`, `scripts/staff-account-recovery.ts`, the Unit 3 changes in `src/lib/{auth/current-user.ts,db/repository/user.ts,email/{sender.ts,templates.ts}}`, `src/proxy.ts`, and `src/app/api/auth/account-access/route.ts`, plus their Unit 3 tests and progress checkboxes. This removes recovery and revocation checks without changing persisted roles or deleting existing audit records. |

## Unit 3 Receipt and Native-Settlement Data

- **Work unit**: `unit-3-recovery-access`
- **Goal**: `identity-recovery-revocation-access`
- **Delivery**: force-chained `feature-branch-chain`, PR slice 3, base `feat/identity-access-unit-2-registration`.
- **Native attempt**: reserved by the orchestrator as `sha256:38f362d058ea99b0ca7a53a4b74a4429cb4699b39173b2e86c2972cb12e96c0c`; no lifecycle operation was invoked by this executor.
- **Evidence revision**: `sha256:19f056f3c2085e50df0e0092fb7ae47ff5022eb15b9326f64219f5ec024cd218` over the Unit 3 tuple (focused 9/88, runtime role-access 6/6, full 145/963, typecheck pass, script typecheck pass, build pass, diff-check pass, 800 total authored changed lines, Mailpit stopped, and the reserved attempt token).
- **Settlement recommendation**: `success` for Unit 3 after the orchestrator computes/records the native content-bound evidence revision; Unit 4 and Unit 5 remain pending.
- **Credentials/services**: only loopback Mailpit was started for the full suite and was stopped afterward; no external credentials or email provider were contacted.

## Unit 4 Implementation Ordering

1. RED tests were written for release-gated provider activation, disabled linking, authenticated tokenized proof, replay denial, provider-identity uniqueness, verified subscriber provisioning, existing identity sign-in, role preservation, and ambiguous email denial before the Google implementation was added.
2. GREEN production code added `getGoogleOAuthConfig`, conditional `GoogleProvider` registration, verified-profile checks, provider/account identity lookup, suscriptora-only OAuth provisioning, role-preserving linked sign-in, and the two-step `link-google` route. The route requires a current active local session, issues a short-lived hashed `google_link` token, and consumes it atomically before linking.
3. TRIANGULATE coverage exercises disabled and incomplete configuration, new subscriber and existing staff identity paths, identity conflict, invalid/replayed proof, and local-email ambiguity. Google provider values are fake test strings and all callback behavior is local/mocked.
4. REFACTOR review confirmed that Google is unavailable unless `GOOGLE_OAUTH_ENABLED=true` plus both runtime credentials are present, matching email alone never links an account, persisted roles are copied unchanged, and the provider/link route can be disabled without mutating account or role records.

## Unit 4 TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 4.1 | `tests/http/google-linking.test.ts`, `tests/auth/google-provider-policy.test.ts`, `tests/auth-options-google.test.ts` | HTTP contract + unit/Mongo integration | N/A for new HTTP file; existing Google tests were run before their contract updates and exposed stale deferred-provider expectations | 4/4 new HTTP tests failed on missing `link-google` route; initial callback path also exposed the existing connection-mock requirement | Final Unit 4 focused suite passed 5 files / 25 tests | Disabled/partial config, new subscriber, existing identity, staff role, conflict, replay, tokenized proof, and ambiguous email cases | Clean; provider flag and rollback boundary remain explicit |
| 4.2 | `tests/http/google-linking.test.ts`, `tests/auth-options-google.test.ts` | HTTP + NextAuth callback contract | Existing auth/options compatibility suite remained green after the intended contract update | Missing route/provider behavior failed before implementation | Unit 4 focused suite passed 25/25 | New `suscriptora`, linked `productora`, existing identity, non-Google, disabled, and email-only conflict paths | Clean; implementation split into pure config/linking helpers |
| 4.3 | `openspec/changes/identity-access/apply-progress.md` | Receipt/documentation | N/A — evidence artifact | N/A — receipt-review task | N/A — artifact records completed behavior | Provider-disable and account/role-preservation rollback cases reviewed | Complete; exact evidence and rollback boundary recorded below |

## Unit 4 Work Unit Evidence

| Evidence | Exact result |
|---|---|
| Focused test command | `npm run test:run -- tests/http/google-linking.test.ts tests/auth/google-provider-policy.test.ts tests/auth-options-google.test.ts tests/auth/nextauth-compatibility.test.ts tests/unit/auth-token.test.ts` → exit 0; 5 files passed; 25 tests passed. |
| Runtime harness command/scenario | `npm run test:run -- tests/http/google-linking.test.ts` → exit 0; 1 file and 5 tests passed using MongoMemoryServer plus mocked NextAuth/Google callback inputs; release gating, token issuance/consumption, replay denial, identity conflict, and role preservation exercised locally; no Google network or credentials. |
| Full serial suite | Started `axllent/mailpit:latest` as `olga-identity-unit-4-mailpit` on loopback `127.0.0.1:1025/8025`; an initial run had one transient Mailpit test timeout, isolated rerun passed 1/1, then the subsequent `npm run test:run` → exit 0; 146 files passed; 970 tests passed. Mailpit was stopped and removed afterward. |
| Typecheck | `npx tsc --noEmit` → exit 0 after removing stale ignored `.next/dev/types` generated artifacts; the build also passed TypeScript validation. |
| Script typecheck | `npm run typecheck:scripts` → exit 0. |
| Build | `npm run build` → exit 0; Next.js compiled and listed `/api/auth/link-google`; Google remained disabled because the release flag was absent in the build environment. |
| Diff hygiene | `git diff --check` → exit 0. |
| Changed-line count | 630 authored changed lines across tracked and new Unit 4 source, tests, and cumulative OpenSpec artifacts; below the 800-line work-unit ceiling. |
| Rollback boundary | Revert/disable only `src/lib/auth/{google,google-linking}.ts`, `src/app/api/auth/link-google/route.ts`, the Unit 4 additions in `src/lib/auth/options.ts`, and the Unit 4 Google tests plus cumulative progress/task evidence. Operational rollback is to remove or set `GOOGLE_OAUTH_ENABLED` to anything other than `true`; this removes the provider and linking availability without deleting identities, changing roles/status, changing passwords, or touching Units 1–3. |

## Unit 4 Receipt and Native-Settlement Data

- **Work unit**: `unit-4-google-linking`
- **Goal**: `identity-google-oauth-explicit-linking`
- **Delivery**: force-chained `feature-branch-chain`, PR slice 4, base `feat/identity-access-unit-3-recovery`.
- **Reserved native attempt**: `sha256:e1990ca52e95d97fa76e921cbb3c060aef0808dfc41d473bd052d140ef4013da`; no lifecycle operation was invoked by this executor.
- **Evidence revision**: `sha256:f0769afaf851df41eeeedd29559cb341551becff0a0ef72183aff727791816c0` over `unit-4-google-linking|attempt=sha256:e1990ca52e95d97fa76e921cbb3c060aef0808dfc41d473bd052d140ef4013da|focused=5-files-25-tests|runtime=1-file-5-tests|full=146-files-970-tests|typecheck=pass|script-typecheck=pass|build=pass|diff-check=pass|changed-lines=630|mailpit=stopped-and-removed|external-google=none|external-credentials=none`.
- **Settlement recommendation**: `success` for Unit 4 after the orchestrator records native content-bound settlement; Unit 5 follows as the final implementation slice.
- **Credentials/services**: fake Google configuration only in tests, mocked NextAuth callback inputs, local MongoMemoryServer, and loopback Mailpit for the serial suite; no external Google OAuth, access token, client credential, or email provider was contacted.

## Transition Contract

- `next_recommended: sdd-verify`
- Next scope: verify Unit 5 — Apply, Audit, and Release Hardening, after the parent records the native settlement for `sha256:0831780685c3b10f714cdbf15a1eb0c8888cdcad80792921987faec980f4dad7`.
- Hard prerequisite: the Unit 5 native attempt must be settled using the evidence revision below; prior Unit 1–4 focused/runtime evidence remains in verification context.
- Final release verification is unblocked by task completion; all 17 tasks are marked complete.

## Unit 5 Implementation Ordering

1. RED tests were written for reviewed receipt integrity and role-preserving apply, proxy rejection without a JWT security version, approved rolling-hour defaults and denial audits, token-free audit persistence, configured trusted-proxy markers, and approved runtime environment names.
2. GREEN added `applyIdentityMigration` with exact receipt digest/sign-off and role-match guards, canonical 5/20 defaults with denial audit events, scalar-only audit metadata and hashed identifiers, fail-closed stale/missing security-version handling, runtime proxy marker configuration, and the migration/rollback runbook.
3. TRIANGULATE covered both admin/productora apply preservation and role mismatch rejection, email/IP limits, empty/safe audit metadata, trusted/untrusted proxy markers, and existing timeout/database failure paths.
4. REFACTOR separated script database connection ownership so apply remains connected for the mutation and always disconnects in the CLI finally block; no real database migration or credential use occurred.

## Unit 5 TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 5.1 | `tests/unit/auth-token.test.ts`, `tests/unit/auth-event-audit.test.ts`, `tests/unit/rate-limit.test.ts`, `tests/middleware.test.ts` | Unit + Mongo integration | Existing Unit 1–4 auth/access baseline passed before edits | Receipt apply/tamper, denial audit, and missing JWT version assertions failed before hardening | Final focused slice passed 6 files / 61 tests | Role mismatch, email/IP boundaries, scalar metadata, and proxy failure paths | Clean; no raw identifiers or secrets persisted |
| 5.2 | `tests/unit/client-ip.test.ts`, `tests/unit/email-config.test.ts` | Unit + configuration contract | Existing client-IP/email config tests: 6 tests passed before edits | Configured proxy marker and approved env assertions failed before configuration changes | Final focused slice passed 6 files / 61 tests | Trusted marker override and Gmail/TLS/sender values | Clean; password remains runtime-only |
| 5.3 | `tests/unit/auth-token.test.ts`, `tests/http/role-access.test.ts` | Mongo integration + HTTP runtime | Existing migration/role-access coverage preserved | Apply receipt and role-preservation cases were added before implementation | Apply rehearsal and real HTTP role flow passed | Admin/productora roles, stale-session invalidation, and provider-disable policy remained unchanged | Clean; rollback changes no roles |

## Unit 5 Work Unit Evidence

| Evidence | Exact result |
|---|---|
| Focused test command | `npm run test:run -- tests/unit/auth-token.test.ts tests/unit/auth-event-audit.test.ts tests/unit/rate-limit.test.ts tests/unit/client-ip.test.ts tests/middleware.test.ts tests/unit/email-config.test.ts` → exit 0; 6 files passed; 61 tests passed. |
| Runtime harness command/scenario | `npm run test:run -- tests/http/verified-registration.test.ts tests/http/account-recovery.test.ts tests/http/google-linking.test.ts tests/http/role-access.test.ts` → exit 0; 4 files passed; 20 tests passed. The real Next.js HTTP role flow and local MongoMemoryServer exercised stale-session invalidation and preserved staff access. |
| Dry-run harness | `printf '[{"id":"legacy-admin","email":"admin@example.test","role":"admin"},{"id":"legacy-productora","email":"olga@example.test","role":"productora","accountStatus":"active","securityVersion":2}]\n' | node --experimental-strip-types scripts/identity-migration.ts --dry-run --stdin` → exit 0; sourceCount 2, one proposed change, rolePreservation true. |
| Apply guard harness | `node --experimental-strip-types scripts/identity-migration.ts --apply` → exit 1; reviewed receipt/sign-off arguments required before any database connection. |
| Apply rehearsal | `npm run test:run -- tests/unit/auth-token.test.ts` → exit 0; 12 tests passed, including reviewed apply, receipt tamper rejection, admin/productora role preservation, and role mismatch hard stop against MongoMemoryServer. |
| Full serial suite | Loopback Mailpit on `127.0.0.1:1025/8025`; `npm run test:run` → exit 0; 147 files passed; 978 tests passed; Mailpit stopped afterward. |
| Typechecks | `npm run typecheck:scripts` and `npx tsc --noEmit` → exit 0. |
| Build | `npm run build` → exit 0; Next.js compiled and listed the identity routes. |
| Diff hygiene | `git diff --check` → exit 0. |
| Changed-line count | 567 authored changed lines across Unit 5 source, tests, configuration, runbook, and cumulative OpenSpec artifacts; below the 800-line work-unit ceiling. |
| Rollback boundary | Revert only Unit 5 changes in `.env.example`, `docs/runbook.md`, `scripts/identity-migration.ts`, `src/lib/auth/{client-ip,rate-limit}.ts`, `src/lib/db/models/auth-event.ts`, `src/proxy.ts`, and the Unit 5 tests/progress checkboxes. Operationally disable Google, revert the identity release/routes, delete auth tokens, and advance affected security versions through the approved procedure; never mutate `role`, `accountStatus`, or audit history. |

## Unit 5 Receipt and Native-Settlement Data

- **Work unit**: `unit-5-migration-hardening`
- **Goal**: `identity-migration-audit-release-hardening`
- **Delivery**: force-chained `feature-branch-chain`; child branch `feat/identity-access-unit-5-hardening`, based on `origin/feat/identity-access-unit-1-foundation`; chain strategy unchanged.
- **Reserved native attempt**: `sha256:0831780685c3b10f714cdbf15a1eb0c8888cdcad80792921987faec980f4dad7`; no lifecycle operation was invoked by this executor.
- **Evidence revision**: `sha256:41b1f8add1724ae24ec3a44b196c912e1a0e72275049fa2dbe87114691b76bb2` over `unit-5-migration-hardening|attempt=sha256:0831780685c3b10f714cdbf15a1eb0c8888cdcad80792921987faec980f4dad7|focused=6-files-61-tests|runtime=4-files-20-tests|full=147-files-978-tests|dry-run=exit-0-source-2-proposed-1-role-preservation|apply-guard=exit-1|apply-rehearsal=12-tests|typecheck=pass|script-typecheck=pass|build=pass|diff-check=pass|changed-lines=567|mailpit=stopped-and-removed|external-google=none|external-credentials=none|real-database-migration=none`.
- **Settlement recommendation**: `success` for Unit 5 after the orchestrator records native content-bound settlement; next recommended phase is `sdd-verify`.
- **Credentials/services**: only loopback Mailpit and MongoMemoryServer were used; no external SMTP, Google OAuth, credentials, or real database migration was used.

## Result Contract

- `status`: `success`
- `change`: `identity-access`
- `work_unit`: `unit-5-migration-hardening`
- `attempt`: `sha256:0831780685c3b10f714cdbf15a1eb0c8888cdcad80792921987faec980f4dad7`
- `next_recommended`: `sdd-verify`
- `settlement`: `success` recommendation; parent owns native settlement
- `evidence_revision`: `sha256:41b1f8add1724ae24ec3a44b196c912e1a0e72275049fa2dbe87114691b76bb2`
- `delivery_strategy`: `force-chained`
- `chain_strategy`: `feature-branch-chain`

## Amendment Slice 1: Provider-First Collision Safety

- [x] 6.1 RED: provider-ID-first lookup, linked subscriber sign-in, and duplicate-index race tests.
- [x] 6.2 RED: subscriber/productora/admin collision tests prove no user, identity, or callback-user mutation and assert the exact Spanish fallback.
- [x] 6.3 GREEN: callback outcome contract, subscriber-only linked sign-in, duplicate cleanup, and no dangerous email linking.

### TDD Cycle Evidence

| Tasks | Test files | Safety net | RED | GREEN | Triangulation | Refactor |
|---|---|---|---|---|---|---|
| 6.1–6.3 | `tests/auth-options-google.test.ts`, `tests/auth/nextauth-compatibility.test.ts` | Existing focused command was blocked by missing local `vitest`; cached sibling dependencies restored the runner without source changes | Tests were written before production edits; first runnable attempt exposed and corrected the race assertion | 2 files / 12 tests passed | Three credential roles, new subscriber, provider-first email mismatch, staff identity, race, fallback, dangerous-linking guard | Helpers isolate linked-subscriber and duplicate-key handling; typecheck remained green |

### Work Unit Evidence

| Evidence | Exact result |
|---|---|
| Focused test | `npm run test:run -- tests/auth-options-google.test.ts tests/auth/nextauth-compatibility.test.ts` → exit 0; 2 files / 12 tests. |
| Runtime harness | Same command; mocked NextAuth callbacks plus MongoMemoryServer exercised collision and race paths; no Google network. |
| Typechecks/build | `npx tsc --noEmit`, `npm run typecheck:scripts`, and `git diff --check` passed. `npm run build -- --webpack` compiled, then stopped on pre-existing unrelated `editar/page.tsx` `PageProps` type error; Turbopack was skipped because the dependency symlink is outside its root. |
| Rollback boundary | Revert `src/lib/auth/{google,options}.ts`, `src/lib/db/repository/user.ts`, the two focused test files, and this slice's task/progress entries; this removes provider-first safety without touching linking UI, recovery, roles, or credentials. |

### Result Contract

- `status`: `success`; `change`: `identity-access`; `work_unit`: `amendment-slice-1-provider-first-collision`.
- `attempt`: `sha256:1282da27cb0f5189e61af61648727070bb74146b76c9c2bca97e29648c77e950`; parent owns settlement; no lifecycle operation invoked.
- `delivery_strategy`: `auto-chain`; `chain_strategy`: `feature-branch-chain`; `next_recommended`: `sdd-verify` after parent settlement.
