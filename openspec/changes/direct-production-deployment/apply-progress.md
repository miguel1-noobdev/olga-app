# Apply Progress — Direct Production Deployment

Change: `direct-production-deployment`
Initial reconciliation pass: documentation-only deployment-contract reconciliation.
Scope of that pass only: documentation and OpenSpec artifacts; no source, tests, operations, VPS, deployment, or native lifecycle changes. Later local correction sections below record separate source and test work units, not part of that initial pass.

## Chronological Record

This is historical incident evidence only. It does not define the current activation contract and is not a mandatory gate for activation.

1. **Repository evidence:** Existing implementation and focused-test records remain repository evidence only; this pass does not convert them into remote operational evidence.
2. **G.2 attempted receipt-only command:** After corrected merges, one authorized ordinary receipt-only command was invoked once and exited nonzero. No sanitized stderr receipt was captured. There was no retry.
3. **G.2 result:** Inconclusive and **NO-GO**. The uncaptured attempt establishes no remote failure or success and no claim about transfer, preparation, archive handling, activation, `current`, PM2, HTTPS, or deployment. The external executor/capture boundary defect is reported in [Gentle AI #3180](https://github.com/gentle-ai/gentle-ai/issues/3180).

## Task Reconciliation

| Task group | Status | Basis |
|---|---|---|
| 1.1–6.2 | Repository evidence recorded | This pass makes no remote operational claim. |
| 7.1–10.1 | Operational status unverified | No captured G.2 receipt establishes a current remote state. |
| 11.1 | Pending | Account creation is recorded; application login proof is absent. |
| 12.1 | Operational status unverified | This record has no captured receipt for a current remote assertion. |
| 13.1 | Operational HTTPS status unverified | Repository config and historical reports are not a captured G.2 receipt. |
| 14.1 | Operational release, `current`, PM2, and health status unverified | No captured receipt establishes these remote facts. |
| 15.1–15.2 | Pending and unverified | No captured evidence proves callback or login validation. |
| 16.1–16.2 | Pending and unverified | No captured evidence proves production smoke or operational renewal. |

## Deployment Contract Reconciliation

The current activation contract is the reduced three-milestone operator path in `tasks.md` and `docs/runbook.md`. It applies to one full candidate SHA. The historical G.2 record below is not an activation contract or a mandatory activation gate.

1. The candidate identity requires the reviewed commit SHA, immutable candidate release-directory SHA, and candidate activation argument to match exactly.
2. Before mutation, `current` must resolve to a distinct declared rollback SHA that identifies an immutable verified release.
3. After successful activation, record that `current` resolves to the candidate SHA.
4. The remote handoff wrapper is POSIX-compatible, explicitly verifies SSH identity and release-path ownership/mode, avoids non-root `runuser`, and propagates every preflight failure.

A failed, missing, ambiguous, or mismatched pre-activation identity or required milestone check stops before activation. It does not switch `current`, invoke PM2, retry, or claim deployment of the candidate SHA. A receipt-only diagnostic remains optional and non-authorizing; it cannot satisfy a milestone or authorize mutation.

### G.2 evidence facts

| Fact | Recorded state |
|---|---|
| Attempt count | One authorized ordinary receipt-only command after corrected merges; no retry. |
| Captured outcome | Inconclusive: the command exited nonzero and no sanitized stderr receipt was captured. |
| Remote outcome | Unverified; no remote failure or success is implied. |
| Transfer, preparation, archive handling, and activation | Unverified; their absence cannot be asserted without the receipt. |
| `current`, PM2, HTTPS, and deployment | Unverified; this record makes no operational success claim. |
| Later-claim receipt fields | `release`, `execution_class`, `connection_count`, `identity`, `metadata`, `effective_root`, `transfer`, `preparation`, and `activation`. |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused validation | Cross-check of `tasks.md` and this progress record; no executable test was required for this documentation-only pass. |
| Runtime harness | N/A — deployment, VPS, and native-attempt execution were explicitly out of scope. |
| Rollback boundary | Revert only the documentation artifacts changed in this reconciliation: `docs/runbook.md`, `tasks.md`, `apply-progress.md`, and `specs/production-operations/spec.md`. |

## Current Status

- **Operational status:** Runtime state remains unverified. The historical G.2 incident is inconclusive and does not define the active activation contract.
- **Active blockers:** Complete and record evidence for Milestone 1 (Host readiness), Milestone 2 (Candidate preparation and activation), and Milestone 3 (Public acceptance).
- **Next phase:** `sdd-verify` after the three reduced milestones are completed; archive remains blocked until verification evidence exists.

## Replaced operational assertions

Prior unsupported operational assertions, including assertions about an active release, `current`, PM2, HTTPS, redirects, health, logs, backups, and ACME, are replaced by the G.2 evidence facts above. The one uncaptured nonzero receipt-only attempt cannot verify or refute any of them.

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
