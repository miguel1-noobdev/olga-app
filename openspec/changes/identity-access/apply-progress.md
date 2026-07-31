# Apply Progress: Identity and Access Unit 1

## Status

Unit 1 (Phase 1: Foundation and Dry Run) is complete in Strict TDD mode. The feature-branch chain remains active; this slice is based on `identity-access-tracker` and must target that tracker only. No commit, push, PR, review, deployment, or migration apply was performed.

## Completed Tasks

- [x] 1.1 RED: Added token and migration dry-run tests before the corresponding production code.
- [x] 1.2 GREEN: Added identity, auth-token, rate-limit, and auth-event models; extended user lifecycle/version persistence and repository operations.
- [x] 1.3 GREEN: Added a read-only `--dry-run` migration receipt and an apply guard requiring reviewed receipt sign-off.
- [x] 1.4 REFACTOR: Recorded ordering, evidence, and rollback boundary below.

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

## Receipt

- Work unit: `unit-1-foundation`
- Goal: `identity-foundation-dry-run`
- Runtime ledger request: `identity-access-unit-1-20260731`
- Runtime ledger revision: `sha256:4edbf09afb42147bde3e995707812f5e5bfa20bf47a2e20c58a838c28f628ce5`
- Delivery: force-chained feature-branch-chain, PR slice 1, under the 800-line slice limit.
- Migration policy: dry-run is read-only; apply is forbidden until the exact receipt has been reviewed and explicitly signed off.
- Credentials/services: none used.

## Remaining Tasks

All assigned Unit 1 tasks are complete. Phase 2 remains pending.

## Transition Contract

- `next_recommended: sdd-apply`
- Next scope: Unit 2 — Verified Registration.
- Hard prerequisite: SMTP/domain, trusted-proxy, and rate-limit approvals must be made before Unit 2 begins.
- Final `sdd-verify` is blocked until all 17 tasks are complete.
