# Tasks: Identity and Access

## Status Reconciliation

Tasks 1.1–5.3 remain recorded as completed (17/17) in `apply-progress.md`. That evidence predates the amended provider-ID-first collision rule; it is not evidence that the new rule is implemented. Tasks 6.1–6.6 are the only remaining work.

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 430–480 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 callback collision → PR 2 linking/UI regressions |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Provider-first callback and collision denial | PR 1; base = feature/tracker branch | `npm run test:run -- tests/auth-options-google.test.ts tests/auth/nextauth-compatibility.test.ts` | Mocked NextAuth + MongoMemoryServer callback scenarios | `src/lib/auth/{options,google}.ts`, `src/lib/db/repository/user.ts`, Unit 1 tests |
| 2 | Explicit linking and collision UX | PR 2; base = PR 1 branch | `npm run test:run -- tests/http/google-linking.test.ts tests/auth/google-provider-policy.test.ts` | Local HTTP/MongoMemoryServer; no Google network | `google-linking.ts`, `link-google/route.ts`, login/components, Unit 2 tests |

## Phase 1: Completed Baseline

- [x] 1.1–5.3 Existing lifecycle, recovery, Google/linking, and hardening tasks are recorded complete; retain their evidence in `apply-progress.md`.

## Phase 2: Provider-First Collision Safety

- [x] 6.1 RED: extend `tests/auth-options-google.test.ts` and `tests/auth/nextauth-compatibility.test.ts` for provider-ID-first lookup, existing linked subscriber session, and duplicate-index races.
- [x] 6.2 RED: assert credentials collisions for `suscriptora`, `productora`, and `admin` create no User/Identity/link/JWT or session and return exactly “No pudimos completar el acceso con Google. Iniciá sesión con tu email y contraseña.”
- [x] 6.3 GREEN: update `src/lib/auth/{options,google}.ts` and `src/lib/db/repository/user.ts` to implement those callback outcomes without `allowDangerousEmailAccountLinking`.

## Phase 3: Explicit Linking and Regression Proof

- [ ] 6.4 RED: extend `tests/http/google-linking.test.ts` for authenticated active verified `suscriptora` linking, staff rejection, foreign-identity conflict, and no role mutation.
- [ ] 6.5 GREEN: update `src/lib/auth/google-linking.ts`, `src/app/api/auth/link-google/route.ts`, and `src/app/(auth)/login/page.tsx`/`src/components/auth/*` for subscriber-only linking and credentials-only fallback UI with no recovery CTA.
- [ ] 6.6 REFACTOR/verify: run both work-unit commands and regression coverage proving `/forgot-password` remains separate and collision responses contain no recovery/link control; record results and rollback boundaries in `apply-progress.md`.
