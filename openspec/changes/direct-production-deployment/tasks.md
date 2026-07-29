# Tasks: Direct Production Deployment

## Current State

Canonical Steps 1–10, 12, 13, and 14 are complete according to their recorded historic implementation and runtime evidence. Production currently serves release `b050790d8dc7ab9638dd74217c18cd770043401f`; repository `HEAD` is `835dd149c0ab2b3b4646d625adaefb63a0df3183`, with no evidence that `835dd14` is deployed. Task 11.1 remains pending application login proof. Steps 15 and 16 remain pending their public callback/login and full production smoke evidence.

The latest reconciliation is documentation-only: it records no new deployment or native-attempt execution and preserves only evidence-supported task boxes. The next runtime action is prohibited until the release-identity gate, POSIX handoff contract, and incomplete evidence are reconciled.

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 900–1,250 across 16 independently merged PRs |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Step 1 → PR 16: Step 16; each targets the previous stack entry and merges to `main` before the next starts |
| Delivery strategy | chained single-step PRs |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

## Mandatory Work-Unit Delivery Policy

Each canonical Step 1–16 is one independent work unit and one conventional-commit PR. For every step: complete its stated RED → GREEN work, run its focused evidence and runtime harness, push to GitHub, open the PR against the previous stack entry, verify it, and merge the stack to `main` before starting the next step. No multi-step or unreviewed out-of-sequence PRs are permitted.

| Unit | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|
| 1 | PR 1 → `main` | Step 1 test/build/typecheck/audit | Clean checkout | Manifest/lockfile |
| 2 | PR 2 → PR 1 | Step 2 compatibility regressions | Local app | Atomic dependency revert |
| 3 | PR 3 → PR 2 | `tests/auth/**` | Login endpoint | Auth options |
| 4 | PR 4 → PR 3 | `tests/health/**` | Loopback probe | Health/PM2 files |
| 5 | PR 5 → PR 4 | `tests/scripts/**` | Disposable Mongo | Scripts |
| 6 | PR 6 → PR 5 | `tests/http/**` | Local authenticated Mongo | Policy files/tests |
| 7 | PR 7 → PR 6 | Ownership/permission verification | `sudo -u migue` file check | Deployment directories |
| 8 | PR 8 → PR 7 | Version verification | Node/npm/PM2 versions | Toolchain/packages |
| 9 | PR 9 → PR 8 | Mongo deployment validation | Auth loopback/external rejection | Mongo service/data volume |
| 10 | PR 10 → PR 9 | Backup-to-restore integrity | Isolated Mongo restore | Backup configuration |
| 11 | PR 11 → PR 10 | Step 6 HTTP suite | Protected script input | Created accounts |
| 12 | PR 12 → PR 11 | Public DNS lookup | Authoritative/public lookup | DNS record |
| 13 | PR 13 → PR 12 | TLS verification | TLS handshake | Nginx site/certificate |
| 14 | PR 14 → PR 13 | Health endpoint check | Loopback `curl` | Prior release/PM2 reload |
| 15 | PR 15 → PR 14 | Redirect/callback/login checks | Public HTTPS requests | Nginx enablement |
| 16 | PR 16 → PR 15 | Production `tests/http/**` | Production evidence checklist | Prior verified release |

## Canonical Deployment Sequence

### Step 1: Clean dependencies; validate install, build, tests, typecheck, audit
- [x] 1.1 RED: add/update dependency-baseline tests at `tests/dependencies/**`; prove failures for unsupported install/build/typecheck/audit states.
- [x] 1.2 GREEN: clean `package.json` and `package-lock.json`; run `npm ci`, tests, typecheck, build, and `npm audit`. Harness: clean checkout. Rollback: manifest and lockfile.

### Step 2: Update Next.js, NextAuth, and vulnerable dependencies without blind jumps
- [x] 2.1 RED: add compatibility regression tests in `tests/auth/**` and `tests/dependencies/**` before each reviewed version increment.
- [x] 2.2 GREEN: update reviewed versions in `package.json`/lockfile incrementally; rerun Step 1 evidence. Harness: local app. Rollback: atomic dependency revert.

### Step 3: Disable Google OAuth unless complete credentials exist
- [x] 3.1 RED: test `tests/auth/**` produces no Google provider both with valid Google credentials and with Google credentials absent.
- [x] 3.2 GREEN: configure `src/lib/auth/options.ts` to register only `CredentialsProvider` regardless of Google credentials. Harness: login endpoint. Rollback: auth options.

### Step 4: Add safe healthcheck and PM2 configuration
- [x] 4.1 RED: test safe health `200` and dependency-failure `503` without secrets in `tests/health/**`.
- [x] 4.2 GREEN: implement/confirm `src/app/api/health/route.ts` and add `ops/pm2/ecosystem.config.cjs`. Harness: loopback probe. Rollback: health and PM2 files.

### Step 5: Harden creation/seed scripts so they never target the wrong database
- [x] 5.1 RED: test environment/database allowlist rejection in `tests/scripts/**`.
- [x] 5.2 GREEN: harden creation/seed scripts under `scripts/**`. Harness: disposable Mongo only. Rollback: scripts.

### Step 6: Add real HTTP tests for anonymous, subscriber, Olga, and Admin roles
- [x] 6.1 RED: add four-role and cross-role-denial HTTP tests in `tests/http/**`.
- [x] 6.2 GREEN: correct auth/route policy files required by failing tests. Harness: local authenticated Mongo. Rollback: policy files and tests.

### Step 7: Create VPS app/release/log directories owned by `migue`
- [x] 7.1 Provision and verify ownership/permissions. Harness: `sudo -u migue` create-file check. Rollback: deployment directories.

### Step 8: Install Node 20, npm, PM2
- [x] 8.1 Install pinned Node 20 toolchain and PM2; verify versions as `migue`. Harness: `node --version`, `npm --version`, `pm2 --version`. Rollback: packages/toolchain.

### Step 9: Create private authenticated persistent MongoDB
- [x] 9.1 RED: run deployment validation rejecting public, unauthenticated, or ephemeral Mongo configuration.
- [x] 9.2 GREEN: provision Mongo with private binding, auth, and persistence. Harness: authenticated loopback connect plus external rejection. Rollback: Mongo service/data volume.

### Step 10: Configure backups and prove restore before real data
- [x] 10.1 Create backup/restore scripts in `ops/scripts/**`; prove restore to isolated Mongo before data entry. Harness: backup-to-restore integrity check. Rollback: backup configuration.

### Step 11: Create Admin and Olga using reviewed scripts without exposing credentials
- [ ] 11.1 Run hardened scripts with protected input; verify each role can log in. Harness: Step 6 HTTP suite. Rollback: created accounts.

### Step 12: Restore DNS `botanicaob.duckdns.org` to `212.227.149.125`
- [x] 12.1 Update DuckDNS and verify public DNS resolution. Harness: authoritative/public lookup. Rollback: DNS record.

### Step 13: Configure Nginx and issue TLS with acme.sh
- [x] 13.1 Add `ops/nginx/botanicasob.conf`; issue and verify certificate with acme.sh. Harness: TLS handshake. Rollback: Nginx site/certificate.

### Step 14: Publish the app with PM2 on `127.0.0.1:3000`
- [x] 14.1 Release immutable app build under `migue`; start PM2 loopback-only. Harness: `curl 127.0.0.1:3000/api/health`. Rollback: prior release and PM2 reload.

### Blocking reconciliation gate: candidate release handoff
- [ ] G.1 Record the same full SHA for the reviewed commit, sealed release directory, versioned activation script, and `current` target before activation. Any mismatch stops before symlink or PM2 changes.
- [ ] G.2 Use a POSIX-compatible SSH handoff wrapper that explicitly verifies remote identity and release ownership/mode, does not use Bash syntax through `sh`, does not call `runuser` as non-root, and does not mask preflight failures.
- [ ] G.3 Capture non-secret, release-aligned evidence for all role logins and denials, ACME test diagnosis, PM2/Nginx log review, and credential cleanup. A failure or missing record is NO-GO.

### Step 15: Connect Nginx, force HTTPS, validate callbacks/login
- [ ] 15.1 RED: execute HTTPS redirect, callback, and login checks before enabling public proxy.
- [ ] 15.2 GREEN: enable Nginx proxy/HTTPS redirect; rerun checks. Harness: public HTTPS requests. Rollback: Nginx enablement.

### Step 16: Run full smoke test for visitor, subscriber, Olga, Admin; review logs, backups, TLS renewal
- [ ] 16.1 Run `tests/http/**` against production for all four roles and denial cases; inspect PM2/Nginx logs.
- [ ] 16.2 Prove backup status and acme.sh renewal dry run. Harness: production evidence checklist. Rollback: prior verified release; NO-GO on any failure.
