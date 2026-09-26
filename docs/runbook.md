# Botánica Esencial OB — Deploy and runbook

How to run the project locally, execute checks, and deploy to the VPS. This document reflects the **current** state of the repo; it does not describe automation that does not exist yet.

## Quick path: local run

1. Start MongoDB and Mailpit:
   ```bash
   docker compose up -d mongo mailpit
   ```
2. Copy and extend the environment file:
   ```bash
   cp .env.example .env.local
   ```
   Add at least `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `INTERNAL_ACCOUNT_CHECK_ORIGIN` (see [Required environment variables](#required-environment-variables)).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

| Variable | Required | Source / example | Notes |
|----------|----------|------------------|-------|
| `MONGODB_URI` | Yes in production | Local MongoDB connection URI | Production requires a valid MongoDB URI and never falls back to localhost. Non-production without this variable uses the local-safe fallback. |
| `NEXTAUTH_SECRET` | At runtime | Generate with `openssl rand -base64 32` | NextAuth JWT signing secret. Login will fail without it. |
| `NEXTAUTH_URL` | Recommended | `http://localhost:3000` | Used by NextAuth for callback URLs. |
| `INTERNAL_ACCOUNT_CHECK_ORIGIN` | At runtime | `http://127.0.0.1:3000` | Trusted origin for middleware's persisted-account check. Use the loopback Next.js listener on the VPS, or a bare HTTPS origin. HTTP is accepted only for `localhost`, `127.0.0.1`, or `[::1]`. |
| `GOOGLE_CLIENT_ID` | Only if enabling Google OAuth | Google Cloud Console | Google auth is wired but **not exposed in the UI**. |
| `GOOGLE_CLIENT_SECRET` | Only if enabling Google OAuth | Google Cloud Console | Never commit this value. |

> **Current reality:** `.env.example` provides local-safe MongoDB and loopback account-check defaults. Add NextAuth values manually for local development or production.

### Privileged admin provisioning

The first public registration never becomes an administrator. Provision or recover an administrator only through `scripts/create-admin.ts` or `scripts/reset-password.ts` with these required environment variable names:

- `MONGODB_URI`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Use a password manager or the deployment secret store. For local one-off work in zsh, follow the silent interactive password-prompt procedure in [`docs/scripts.md`](./scripts.md#privileged-admin-scripts) and run the selected script with `npx tsx`; never inline a password in a shell command or save it in a committed environment file. Both scripts fail before connecting when a required value is absent or invalid and never print credentials.

## Local service startup

`docker-compose.yml` runs MongoDB 7.0 bound to `127.0.0.1:27017` with a persistent Docker volume named `mongo-data`. It also runs Mailpit with SMTP at `127.0.0.1:1025` and its local API at `127.0.0.1:8025`.

```bash
docker compose up -d mongo mailpit
```

Both services are configured with `restart: unless-stopped`. MongoDB has **no authentication** in the local setup; every published port is bound to localhost only so it is not exposed to the network. Run one local Docker test harness at a time because these host ports are shared. Before runtime email tests, start both services and wait for MongoDB to accept connections and for Mailpit to report `healthy` in `docker compose ps`.

## Build, test, and CI checks

| Command | What it does |
|---------|--------------|
| `npm run dev` | Next.js dev server on [http://localhost:3000](http://localhost:3000). |
| `npm run build` | Production build. |
| `npm run start` | Production server; requires a prior build. |
| `MAILPIT_RUNTIME_TEST=1 npm run test:run` | Run the Vitest suite once, including the Mailpit runtime test. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:coverage` | Run Vitest with `v8` coverage. |
| `npm run typecheck:scripts` | Type-check the files under `scripts/` separately. |

### CI workflow

`.github/workflows/ci.yml` runs on every push and pull request to `main`/`master`:

1. `npm ci`
2. `npm run build`
3. `MAILPIT_RUNTIME_TEST=1 npm run test:run`
4. `npm run typecheck:scripts`

The workflow uses Node.js 24 LTS and the `npm` cache.

### GitHub-hosted Node runtime rehearsal

`.github/workflows/node24-systemd-rehearsal.yml` proves the Node 24 cutover and Node 20 recovery path on disposable GitHub-hosted Ubuntu 24.04 VMs. It runs when a pull request targets the issue #71 tracker branch. Never substitute personal WSL or the production VPS for this evidence.

#### Review path

1. Confirm each matrix job proves `systemd` is PID 1 and rejects WSL or a container runtime before provisioning.
2. Review the pinned Node 20, Node 24, and PM2 versions in the workflow.
3. Require all three fresh-VM scenarios to pass:

   | Scenario | Required final state |
   |----------|----------------------|
   | `positive` | Candidate is current, healthy, and running through configured Node 24. |
   | `health-failure` | Candidate health is disrupted externally; rollback is current, healthy, and running through configured Node 20. |
   | `interruption` | Only the activation shell receives TERM; its EXIT handler restores the declared Node 20 release/runtime. |

4. Download `node24-systemd-receipt-<scenario>` for each job. Every artifact contains one sanitized line with the transaction identifier, exact SHAs and versions, timestamps, stage outcomes, identity booleans, HTTP status, and rollback result.

The workflow provisions only job-local users, loopback SSH, runtime copies, PM2 homes, releases, secrets, and MongoDB. GitHub discards each VM after its job. Child logs and environment values are not uploaded.

A failed or missing scenario is **NO-GO** for issue #71. Passing this rehearsal does not authorize production deployment, production access, OAuth activation, or a retry against another environment. Those remain separate operator decisions.

#### Manual rerun

After the workflow exists on the default branch, `workflow_dispatch` accepts one full lowercase rollback commit SHA. The selected workflow ref supplies the candidate SHA. Both commits must exist, be distinct, and remain available to `git archive`; otherwise the run stops before provisioning.

## Auth reality

- **Email and password** is the only login path exposed to end users in the UI.
- **Google OAuth** is configured in `src/lib/auth/options.ts` but intentionally **not shown in the UI**. It stays disabled until the brand owner explicitly decides to turn it on.
- Roles exist (`suscriptora`, `productora`, `admin`). Public registration creates only `suscriptora` accounts.
- `productora` and `admin` are staff roles for the Laboratorio; `admin` retains staff support access to Olga's Laboratorio.

### Identity migration and rollback rehearsal

Identity migration is a two-step operator action. The dry run is read-only and must be reviewed before any apply. Both commands must target an explicitly allowlisted local/test database while rehearsing; never use a production URI for a rehearsal and never place a password or token in a command, receipt, log, or evidence record.

1. Create and save a non-secret dry-run receipt from the reviewed release:

   ```bash
   export SCRIPT_ENV=test
   printf '%s\n' '[{"id":"legacy-admin","email":"admin@example.test","role":"admin"}]' \
     | node --experimental-strip-types scripts/identity-migration.ts --dry-run --stdin \
     > identity-migration-receipt.json
   ```

2. Review the exact `receiptId`, proposed lifecycle fields, and `rolePreservation: true`. Obtain explicit operator sign-off for that receipt. The apply command rejects a missing, altered, or mismatched receipt/sign-off and updates only the lifecycle fields; it never writes a role.

3. Apply only the reviewed receipt against the approved target, recording non-secret output:

   ```bash
   node --experimental-strip-types scripts/identity-migration.ts --apply \
     --receipt-file identity-migration-receipt.json \
     --approved-by admin@example.test \
     --reviewed-at 2026-08-02T13:00:00.000Z
   ```

   `MONGODB_URI` and `SCRIPT_ENV` are loaded from the runtime environment. The script reads the current accounts, verifies every receipt role before changing anything, then reports an apply receipt. A role mismatch or missing account is a hard stop. Existing roles remain authoritative and existing active accounts remain active.

#### Approved runtime configuration

- Temporary production SMTP is Gmail at `smtp.gmail.com:465` with TLS, sender `esenciales.ob@gmail.com`, and `SMTP_PASSWORD` supplied only as a VPS runtime secret. The password is never stored in this repository or copied into a receipt.
- Automated tests MUST use loopback Mailpit (`127.0.0.1:1025`) and MUST NOT contact Gmail.
- Nginx is the only trusted forwarded-IP source. It sends `X-Trusted-Proxy: local-nginx` and `X-Forwarded-For: $remote_addr`; the application uses `TRUSTED_PROXY_NAME=local-nginx` and ignores forwarded values from other callers.
- Google remains disabled unless `GOOGLE_OAUTH_ENABLED=true` and complete runtime credentials are deliberately provisioned.

#### Rollback boundary

If delivery or access checks fail, stop activation and restore the prior release/configuration through the deployment runbook. Disable Google by removing or setting `GOOGLE_OAUTH_ENABLED` to a non-true value, and disable the new identity routes by reverting the release rather than changing account roles. Invalidate issued tokens and sessions by deleting auth tokens and advancing each affected account's `securityVersion` through the approved operator procedure. Verify that `role`, `accountStatus`, and audit records are unchanged; never roll back by assigning or removing `admin` or `productora`.

## Production deployment contract

### Reduced operator path

Work one candidate SHA through these three milestones. Each requires timestamped, sanitized evidence and an explicit operator decision. A failed, missing, ambiguous, or unsanitized check is NO-GO; do not advance to the next milestone.

#### 1. Host readiness

1. Verify application, immutable-release, configuration, and log directories with their intended ownership and permissions; record Node.js 24 LTS, npm, and PM2 versions.
2. Run MongoDB as authenticated persistent storage on loopback only. Prove authenticated loopback access and public-network refusal.
3. Prove backup and isolated restore before accepting production data.
4. Provision protected Admin and Olga accounts with root-only secrets and reviewed scripts; retain no credentials in evidence.
5. Confirm authoritative DNS, Nginx HTTPS, a loopback-only application upstream, and valid TLS.

Failure leaves production activation untouched. Revert only the affected host configuration to its prior known-safe state.

#### 2. Candidate preparation and activation

1. Select one reviewed full SHA and complete the release identity gate below.
2. Prepare and seal an immutable release with the fixed runtime configuration. Retain the prior verified compatible release as the declared rollback target.
3. Verify the POSIX handoff contract, root-only secret-file checks, build result, and loopback health before mutation.
4. After explicit operator approval, use only the root-owned activation script to atomically update `current` and manage PM2. After successful activation, verify and record that `current` resolves to the candidate full SHA, then confirm loopback health and stable process identity.

A mismatch, preflight failure, mutable release, failed health check, or unstable process stops before `current` or PM2 changes. If the candidate becomes unhealthy after activation, atomically restore the retained release and revalidate loopback traffic. Do not cross an unapproved data change.

#### 3. Public acceptance

1. Confirm HTTPS redirect, certificate validity, callbacks, and login behavior for anonymous visitors, subscriber, Olga, and Admin, including denial cases.
2. Review sanitized, release-aligned PM2 and Nginx logs; confirm backup status, isolated restore evidence, ACME test diagnosis, and TLS-renewal evidence.
3. Remove temporary protected credentials and retain only non-secret proof of cleanup.
4. Record a named operator's explicit public-acceptance decision for the candidate SHA.

A failed or incomplete acceptance record is NO-GO. Keep the prior verified release serving, or atomically roll back to it if activation occurred. Do not claim public acceptance until every item passes.

### Release identity gate

Activation requires two separate identities:

| Identity | Required value |
|---|---|
| Candidate | The reviewed commit SHA, immutable candidate release-directory SHA, and candidate activation argument are the same full SHA. |
| Rollback | The pre-activation `current` target and declared rollback argument are the same full SHA, distinct from the candidate SHA, and name an immutable verified release. |

The operator records both non-secret SHA values before activation. A mismatch, missing value, unresolved symlink, mutable release content, or failed preflight is a hard failure: do not switch `current`, start or reload PM2, retry, or continue to later gates.

### Activation controls

For the selected candidate SHA and its distinct declared rollback SHA, the operator must record these checks before activation:

1. The candidate identity, rollback identity, release-directory ownership and mode, and immutable-content checks.
2. The reviewed build and focused validation.
3. The activation script's interpreter and syntax using its shebang interpreter; never run Bash syntax through `sh`.
4. Secret-file existence, root ownership, mode `0600`, required-variable presence, and runtime identity without printing values.
5. DNS, TLS, loopback health, database backup/recovery, and the ACME test result. Diagnose a failed ACME test before activation; a non-root Nginx check unable to read the private key is inconclusive, not passing.

Only after these checks pass and approval is recorded may the root-only activation script atomically replace `current` and manage PM2. After successful activation, verify and record that `current` resolves to the candidate SHA before re-running loopback and public-acceptance checks against that SHA.

### Versioned POSIX release handoff

The transfer/handoff wrapper must be POSIX-compatible because remote SSH commands may run under `/bin/sh`. Bash-specific syntax, including arrays, `[[ ... ]]`, `pipefail`, `SECONDS`, indirect expansion, and `source`, belongs only inside the versioned activation script invoked through its Bash shebang, not in a `sh` wrapper.

Before any transfer, the wrapper must explicitly record and verify the remote SSH identity with `id`, and verify the release path's owner, group, and mode with a non-destructive metadata check. A non-root SSH session must not invoke `runuser`; only the root-only activation script may change to the PM2 account. The wrapper must propagate failed preflight commands directly. It must not hide failures with command substitutions, `|| true`, redirections, or conditional branches that convert a failed check into success.

The handoff must name the full candidate SHA in its release directory and preserve the prior `current` target for rollback. It stops at the first failure and records the failed gate, command class, timestamp, remote identity, and non-secret metadata. It does not retry or activate a different SHA.

#### Optional receipt-only diagnostic

This optional diagnostic is not part of the deployment gate and does not authorize mutation. It may inspect a managed release without archive standard input. `HANDOFF_RECEIPT_ONLY=1` accepts an approved non-secret endpoint selector plus owner/group/mode policy; it derives the active managed release and effective root within one remote query, then validates the canonical lowercase 40-character SHA, immutable release relationship, and metadata policy. Do not supply a candidate SHA or remote root for this mode:

```bash
HANDOFF_RECEIPT_ONLY=1 RECEIPT_ENDPOINT_SELECTOR=<approved-selector> EXPECTED_RELEASE_OWNER=<owner> EXPECTED_RELEASE_GROUP=<group> EXPECTED_RELEASE_MODE=<mode> /bin/sh ops/scripts/handoff-release.sh
```

The receipt is a sanitized `key=value` record. `release` is the active SHA derived from the managed process; `connection_count=1` proves the query budget; `identity` and `metadata` report matched or failed comparisons; `effective_root=derived` means the root was derived without printing it. `execution_class=remote_command_failure` means the one SSH command exited nonzero; `execution_class=invalid_remote_output` means it exited successfully but did not return a valid managed-release record; `execution_class=success` means the remote command and its managed-release record were valid; and `execution_class=not_attempted` means local input validation stopped before the query. `transfer=absent`, `preparation=absent`, and `activation=absent` are explicit non-mutation evidence. Missing selector or policy fails before remote work; malformed, ambiguous, or mismatched discovery fails closed after that one query.

A diagnostic receipt has no fields for the reviewed commit, activation-script SHA, `current` target, PM2 state, serving health, or caller-side capture. Its absence or failure makes no production-state claim and cannot authorize transfer, preparation, activation, service management, or any other mutation.

`ops/scripts/prepare-release.sh` is the POSIX (`/bin/sh`) preparation stage. Production runtime selection comes only from the fixed-shape, non-secret runtime configuration `${APP_ROOT}/config/node24-runtime.conf` file (`/srv/botanica-ob/config/node24-runtime.conf` when production `APP_ROOT=/srv/botanica-ob`) with exactly this shape:

```text
NODE24_BIN=/absolute/canonical/path/to/node
NODE24_VERSION=v24.<minor>.<patch>
NODE24_NPM_CLI=/absolute/canonical/path/to/npm-cli.js
NODE24_NPM_VERSION=<major>.<minor>.<patch>
NODE20_BIN=/absolute/canonical/path/to/node
NODE20_VERSION=v20.<minor>.<patch>
NODE20_PM2_CLI=/absolute/canonical/path/to/node20-pm2-cli.js
NODE20_PM2_VERSION=<major>.<minor>.<patch>
NODE24_PM2_CLI=/absolute/canonical/path/to/node24-pm2-cli.js
NODE24_PM2_VERSION=<major>.<minor>.<patch>
PM2_RUN_AS=<pm2-execution-account>
PM2_HOME=/absolute/path/to/pm2-home
```

Install that config as a root-owned regular, non-symlink file that is not group/world writable. `NODE24_BIN` and `NODE24_NPM_CLI` must be root-owned, canonical absolute regular non-symlink files with no write bits; Node must be readable and executable, and the npm CLI must be readable. Preparation validates and uses only this Node 24/npm pair; the remaining fixed-shape fields are not executed or runtime-validated during preparation. The config location is derived from `APP_ROOT` and cannot be replaced through `NODE24_CONFIG` or another ambient override.

The ordinary handoff quotes and explicitly forwards `RELEASE_SHA`, `APP_ROOT`, and the expected owner/group/mode policy to the remote preparer, invoked from `APP_ROOT/ops/scripts` outside the candidate release directory. Preparation fixes early OS utility resolution to `/usr/bin:/bin`; production checks do not inherit the caller's `PATH`, and no utility PATH override exists. After the configured Node binary passes canonical-file, mode, and Node 24 version validation, preparation exports a runtime `PATH` containing exactly its canonical directory followed by `/usr/bin:/bin` and configures npm's supported `script-shell` to the canonical current preparer. In its private lifecycle-shell mode, the preparer verifies npm's Node identity, re-prepends the validated Node directory ahead of npm-generated `node_modules/.bin` entries while retaining those entries, and delegates the lifecycle command to `/bin/sh`; malformed or mismatched lifecycle invocations fail without preparation receipts. Preparation accepts the reviewed `git archive` tar stream on standard input, validates the identity, existing empty target, owner, group, exact mode, and writability, and invokes exactly `<NODE24_BIN> <NODE24_NPM_CLI> ci` and `<NODE24_BIN> <NODE24_NPM_CLI> run build`. Runtime selection never uses a bare top-level `node` or `npm` and remains independent of ambient `PATH`.

Preparation verifies that the extracted activation accepts a caller-supplied release SHA and seals the target without activating it. A release directory approved as empty remains empty until preparation begins archive extraction. Every exit emits one sanitized, timestamped `key=value` record containing `release=unverified` until the candidate SHA passes validation, then the validated SHA, plus stage, status, and verified versions, without config contents, hosts, usernames, home paths, or environment values; failed `id`, `stat`, extraction, install, build, and seal stages retain their external exit status. Invoke it explicitly with `/bin/sh`; it does not load secrets, invoke `runuser`, PM2, or activation.

After every preceding gate has passed, activate only the prepared candidate with its full SHA and the declared full rollback SHA:

```bash
sudo /srv/botanica-ob/releases/<full-candidate-sha>/ops/scripts/activate-pm2-release.sh <full-candidate-sha> <full-rollback-sha>
```

Candidate activation fully validates the fixed Node 24 and Node 20 runtime pairs before mutation and invokes candidate PM2 only through Node 24. `current` must resolve to the declared immutable rollback release; after a candidate failure, it deletes through Node 24, atomically restores that link, then starts and proves the rollback through Node 20 (`rollback=passed` requires loopback HTTP 200 and a stable Node 20 PID/cwd; otherwise `rollback=failed`).

The focused local sandbox tests cover the successful preparation path; every pre-extraction guard; late writability failure; activation-ID rejection; and exact failures from `id`, `stat`, extraction, install, build, and sealing. They do not prove a remote handoff, VPS build or sealing, rollback, or any runtime gate.

### One-time credential handling and evidence

Protected one-time credentials are created outside Git, installed only into a root-owned file with owner/group `root:root` and mode `0600`, and consumed only by a root-owned command with command tracing disabled. Never put credential values in shell arguments, terminal output, logs, repository files, test fixtures, or evidence records.

Evidence may include timestamps, command names, exit statuses, HTTP statuses, SHA values, file ownership/modes, certificate metadata, checksums, and sanitized log markers. It must exclude secret values, connection strings, session material, passwords, and copied raw logs. Cleanup is mandatory even when a gate fails: securely remove the temporary credential file and record only non-secret proof of its absence. If cleanup evidence is missing, runtime acceptance is incomplete.

## What is intentionally not deployed

| Path / file | Why it stays out |
|-------------|------------------|
| `ideas/` | Planning documents, UI references, and historical design explorations. Not part of the application. |
| `tests/` | Test code; not needed at runtime. |
| `.env.example`, `.env*.local`, `.env` | Local configuration templates and secrets; not part of a deployable release. |
| `img/WhatsApp Image*.jpeg` | Local reference captures from Olga's notebook; ignored by `.gitignore`. |

## Common issues checklist

- [ ] MongoDB or Mailpit is not running → `docker compose up -d mongo mailpit`
- [ ] `NEXTAUTH_SECRET` is missing → the app may build, but login will fail
- [ ] `MONGODB_URI` points to the wrong database → scripts will affect the wrong data
- [ ] `npx tsx` is not available → run `npm install`, then retry the verified local invocation

## Remaining operational gaps

- Host readiness, candidate preparation/activation, and public-acceptance evidence remain pending; do not make a production-state claim without the applicable milestone evidence.
- No centralized log aggregation or alerting.
