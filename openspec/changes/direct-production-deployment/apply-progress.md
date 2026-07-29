# Apply Progress — Direct Production Deployment

Change: `direct-production-deployment`
Pass: documentation-only deployment-contract reconciliation.
Scope: documentation and OpenSpec artifacts only; no source, tests, operations, VPS, Git, deployment, or native lifecycle changes.

## Chronological Record

1. **Steps 1–6 — application and policy work:** Existing implementation, focused tests, builds, and runtime evidence recorded in the prior progress history support tasks 1.1–6.2.
2. **Steps 7–10 — VPS foundation:** Existing non-secret runtime evidence supports directory ownership, toolchain, authenticated persistent MongoDB, and backup/restore tasks 7.1, 8.1, 9.1–9.2, and 10.1.
3. **Step 11 — privileged accounts:** Account creation and protected credential handling are recorded, but application login proof for both accounts is absent. Task 11.1 remains incomplete.
4. **Step 12 — DNS:** Existing public lookup evidence supports task 12.1; `botanicaob.duckdns.org` resolved to `212.227.149.125`.
5. **Step 13 — Nginx and TLS:** Complete. Commit `7749ac6` added `ops/nginx/botanicasob.conf` and its focused test. Native record `#1679` records the installed certificate, HTTP-to-HTTPS redirect, hostname/TLS validation, and certificate validity through 2026-10-26.
6. **Step 14 — immutable PM2 release:** Historic completion is supported for release `b050790d8dc7ab9638dd74217c18cd770043401f`. Commit `713c1f0` added the root-only atomic activation script and focused test. Native records `#1721`, `#1724`, and `#1731` record that release's PM2 activation and loopback `/api/health` HTTP 200. Repository `HEAD` is now `835dd149c0ab2b3b4646d625adaefb63a0df3183`; the read-only audit does not establish that `835dd14` is deployed.
7. **Steps 15–16 — public login and production smoke:** No complete callback/login, four-role smoke, denial matrix, log review, backup-status, or renewal-dry-run evidence is recorded. Tasks 15.1–15.2 and 16.1–16.2 remain incomplete.

## Task Reconciliation

| Task group | Status | Basis |
|---|---|---|
| 1.1–6.2 | Complete | Existing implementation and validation evidence recorded before this pass. |
| 7.1–10.1 | Complete | Existing non-secret VPS and backup/restore evidence. |
| 11.1 | Pending | Account creation is recorded; application login proof is absent. |
| 12.1 | Complete | Existing public DNS resolution evidence. |
| 13.1 | Complete | Commit `7749ac6`, focused config test, and native TLS evidence `#1679`. |
| 14.1 | Complete | Commit `713c1f0`, focused activation tests, and native activation/health evidence `#1721`, `#1724`, `#1731`. |
| 15.1–15.2 | Pending | Root/TLS evidence does not prove callback and login validation. |
| 16.1–16.2 | Pending | Complete production smoke and operational renewal evidence is absent. |

## Deployment Contract Reconciliation

The next runtime action is prohibited. It may resume only after every gate below is reconciled for one full candidate SHA:

1. The reviewed commit SHA, sealed release-directory SHA, activation-script `RELEASE_ID`, and `current` symlink target match exactly.
2. The remote handoff wrapper is POSIX-compatible, explicitly verifies SSH identity and release-path ownership/mode, avoids non-root `runuser`, and propagates every preflight failure.
3. Timestamped, non-secret evidence is release-aligned and complete for role logins and denials, ACME test diagnosis, PM2/Nginx logs, backup/recovery, and credential cleanup.

A failed, missing, ambiguous, or mismatched gate stops before activation. It does not switch `current`, invoke PM2, retry, or claim deployment of the candidate SHA.

### Read-only audit facts

| Fact | Recorded state |
|---|---|
| Active production release | `b050790d8dc7ab9638dd74217c18cd770043401f` |
| Repository `HEAD` / candidate | `835dd149c0ab2b3b4646d625adaefb63a0df3183` |
| Candidate deployment status | Unknown; no claim that `835dd14` is deployed. |
| PM2 | Online with zero restarts in the read-only snapshot. |
| Nginx test as non-root | Inconclusive because the private key cannot be read; it is not configuration-passing evidence. |
| ACME | Test/dry-run failure remains undiagnosed. |
| Runtime acceptance | Incomplete for privileged role login/denial evidence and release-aligned logs. |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused validation | Cross-check of `tasks.md` and this progress record; no executable test was required for this documentation-only pass. |
| Runtime harness | N/A — deployment, VPS, and native-attempt execution were explicitly out of scope. |
| Rollback boundary | Revert only the documentation artifacts changed in this reconciliation: `docs/runbook.md`, `design.md`, `tasks.md`, `apply-progress.md`, and `specs/production-operations/spec.md`. |

## Current Status

- **Historically completed:** Canonical tasks 1.1–10.1, 12.1, 13.1, and 14.1, as recorded above.
- **Blocking before the next runtime action:** G.1–G.3, 11.1, 15.1, 15.2, 16.1, and 16.2.
- **Next phase:** `sdd-verify` after the remaining tasks are completed; archive remains blocked until verification evidence exists.

## Attempt 34 — Remaining production evidence

Native runtime attempt ordinal 34 was begun with the exact status revision and finished as `failed` with zero repository changed lines. The protected temporary credential file was checked as `root:root` mode `0600`, used only inside a root-owned shell with command tracing disabled, and removed with non-secret deletion evidence before return. No credential value was printed, logged, copied, committed, or returned.

Verified non-secret observations from this attempt:

- HTTP redirects to HTTPS with status `301` and the canonical HTTPS location.
- HTTPS root and `/login` return `200`; `/api/health` returns `200`; a missing ACME challenge returns `404`.
- Anonymous requests to `/blog`, `/jardin-digital`, `/laboratorio`, and `/admin` return `307` to `/login`.
- `/api/auth/providers` exposes only the `credentials` provider.
- PM2 remains online. Attempt 34 recorded Nginx configuration validation as passing; the later read-only non-root audit is inconclusive because that identity cannot read the private key, so it is not passing evidence.
- A fresh MongoDB backup archive has valid checksum and metadata.
- PM2 and Nginx logs were inspected without returning raw log content. Nginx had zero matching error markers; PM2 inspection recorded error markers requiring follow-up.
- The acme.sh renewal dry-run returned failure.

Authenticated provisioning/login and all role-specific smoke results were not accepted as complete because the terminal output from the root-owned runner was not captured before its cleanup wrapper failed. Tasks 11.1, 15.1, 15.2, 16.1, and 16.2 remain unchecked. The next runtime action is prohibited until the release-identity gate, corrected POSIX-compatible non-secret execution wrapper, complete cleanup evidence, and ACME diagnosis are reconciled.

## Attempt 34 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `N/A` — no source changes; repository focused tests were not rerun. |
| Runtime harness command/scenario and exact result | Native attempt 34; anonymous HTTPS/proxy, health, provider-policy, backup checksum/metadata, PM2/Nginx inspection, and cleanup checks ran; authenticated role evidence incomplete; acme.sh dry-run failed. |
| Rollback boundary | No repository or production configuration changes. Remove only the temporary smoke runner and retain the existing release, PM2 process, Nginx configuration, and backup archive. |

## Local Correction — Image Disk Cache

- Added `images.maximumDiskCacheSize: 0` to `next.config.mjs` so immutable releases do not accumulate optimized image files on disk.
- Added a focused configuration test. RED: the new assertion received `undefined`; GREEN: `npm run test:run -- tests/next-image-cache.test.ts` passed with 1 test.
- No tracked executable acme.sh verification harness exists in this repository. Repository search found only documentation, Nginx certificate references, and OpenSpec evidence, so no ACME command or test was invented.
- Tasks 11.1, 15.1, 15.2, 16.1, and 16.2 remain pending; no runtime evidence was added.

## Local Correction Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- tests/next-image-cache.test.ts` — passed: 1 test file, 1 test. |
| Runtime harness command/scenario and exact result | N/A — local Next.js configuration has no runtime boundary in this work unit; deployment and native runtime lifecycle were explicitly out of scope. |
| Rollback boundary | Revert `next.config.mjs` and `tests/next-image-cache.test.ts`; the OpenSpec record can be independently reverted from `openspec/changes/direct-production-deployment/apply-progress.md`. |

## Local Correction TDD Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| Disable Next image disk cache | `tests/next-image-cache.test.ts` | Unit | N/A (new focused test) | Failed: expected `undefined` to equal `0` | Passed: 1/1 | Skipped: structural config with one valid output | None needed |

## Local Correction — POSIX Release Preparation Handoff

- Replaced `ops/scripts/prepare-release.sh` with a minimal `/bin/sh` preparation contract: `RELEASE_SHA` plus `APP_ROOT` and expected owner/group/mode policy; no activation or secret handling.
- RED: `npm run test:run -- tests/scripts/release-preparation.test.ts` failed in all 15 new sandbox scenarios against the prior partial handoff. GREEN: the same command passed with 15 tests after the replacement.
- The local fake-command sandbox proves successful preparation, every target guard before extraction, late writability, activation-ID rejection, and exact external-status propagation for `id`, `stat`, extraction, install, build, and sealing. It does not prove remote execution or any VPS state.
- No SSH, target host, credential, activation, PM2, or service action occurred. G.2 remains unchecked because no runtime handoff evidence exists; all current NO-GO gates remain unchanged.

## Local POSIX Handoff Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npm run test:run -- tests/scripts/release-preparation.test.ts` — passed: 1 test file, 16 tests. |
| Runtime harness command/scenario and exact result | N/A — local temporary-directory harness only; SSH, target preparation, activation, PM2, and services were explicitly out of scope. |
| Rollback boundary | Remove `ops/scripts/prepare-release.sh` and `tests/scripts/release-preparation.test.ts`; independently revert the local evidence in this progress record and `docs/runbook.md`. |
