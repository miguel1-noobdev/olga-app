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
| `npm run test:run` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:coverage` | Run Vitest with `v8` coverage. |
| `npm run typecheck:scripts` | Type-check the files under `scripts/` separately. |

### CI workflow

`.github/workflows/ci.yml` runs on every push and pull request to `main`/`master`:

1. `npm ci`
2. `npm run build`
3. `npm run test:run`
4. `npm run typecheck:scripts`

The workflow uses Node.js 20 and the `npm` cache.

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

### G.2 evidence status and freeze

**NO-GO:** G.2 is inconclusive. After the corrected merges, one authorized ordinary receipt-only command was invoked once and exited nonzero. No sanitized stderr receipt was captured. The absence of that captured receipt means this record cannot determine the remote outcome, the receipt fields, or whether the command reached the remote executor. It does not imply remote failure or success, transfer, preparation, archive handling, activation, a `current` target, PM2 state, HTTPS state, or deployment status. There was no retry.

The external executor/capture boundary defect is publicly reported in [Gentle AI #3180](https://github.com/gentle-ai/gentle-ai/issues/3180). Do not restore historical operational claims from this missing receipt.

A later G.2 claim requires one captured, sanitized receipt for the authorized receipt-only attempt containing exactly these contract fields: `release`, `execution_class`, `connection_count`, `identity`, `metadata`, `effective_root`, `transfer`, `preparation`, and `activation`. Until that evidence exists, release identity, remote identity, owner/group/mode comparison, preflight outcome, and the absence of transfer, preparation, and activation are all unverified.

### Release identity gate

Activation is permitted only when all four identities match exactly:

| Identity | Required value |
|---|---|
| Committed SHA | The reviewed Git commit selected for deployment. |
| Immutable release SHA | The full commit SHA naming the sealed release directory. |
| Activation argument | The full candidate SHA supplied to the reviewed, versioned activation script. |
| `current` symlink target | The sealed release directory named by that same full SHA. |

The operator records all four non-secret values before activation. A mismatch, missing value, unresolved symlink, mutable release content, or failed preflight is a hard failure: do not switch `current`, start or reload PM2, retry, or continue to later gates.

### Required gate order

All gates precede activation and each must produce timestamped, non-secret evidence for the same candidate SHA:

1. Confirm the four release identities and the release directory ownership, mode, and immutable content checks.
2. Run the reviewed build and focused validation for that committed SHA.
3. Check the activation script's interpreter and syntax with the interpreter named in its shebang; never execute Bash syntax through `sh`.
4. Validate secret-file existence, root ownership, mode `0600`, required variable presence, and runtime identity without printing values.
5. Verify DNS, TLS, loopback health, database/backup recovery, and the ACME test result. Diagnose a failed ACME test before activation; a non-root Nginx validation that cannot read the private key is inconclusive, not passing evidence.
6. Capture release-aligned PM2 and Nginx diagnostics, then prove anonymous, subscriber, productora, and admin flows plus their denial cases.
7. Only after every gate passes may the root-only activation script atomically replace `current` and manage PM2. Re-run loopback and public acceptance checks against the activated SHA.

### Versioned POSIX release handoff

The transfer/handoff wrapper must be POSIX-compatible because remote SSH commands may run under `/bin/sh`. Bash-specific syntax, including arrays, `[[ ... ]]`, `pipefail`, `SECONDS`, indirect expansion, and `source`, belongs only inside the versioned activation script invoked through its Bash shebang, not in a `sh` wrapper.

Before any transfer, the wrapper must explicitly record and verify the remote SSH identity with `id`, and verify the release path's owner, group, and mode with a non-destructive metadata check. A non-root SSH session must not invoke `runuser`; only the root-only activation script may change to the PM2 account. The wrapper must propagate failed preflight commands directly. It must not hide failures with command substitutions, `|| true`, redirections, or conditional branches that convert a failed check into success.

The handoff must name the full candidate SHA in its release directory and preserve the prior `current` target for rollback. It stops at the first failure and records the failed gate, command class, timestamp, remote identity, and non-secret metadata. It does not retry or activate a different SHA.

For a non-mutating receipt-only preflight, invoke the wrapper without archive standard input. `HANDOFF_RECEIPT_ONLY=1` accepts an approved non-secret endpoint selector plus owner/group/mode policy; it derives the active managed release and effective root within its single remote query, then validates the canonical lowercase 40-character SHA, immutable release relationship, and metadata policy. Do not supply a candidate SHA or remote root for this mode:

```bash
HANDOFF_RECEIPT_ONLY=1 RECEIPT_ENDPOINT_SELECTOR=<approved-selector> EXPECTED_RELEASE_OWNER=<owner> EXPECTED_RELEASE_GROUP=<group> EXPECTED_RELEASE_MODE=<mode> /bin/sh ops/scripts/handoff-release.sh
```

The receipt is a sanitized `key=value` record. `release` is the active SHA derived from the managed process; `connection_count=1` proves the query budget; `identity` and `metadata` report matched or failed comparisons; `effective_root=derived` means the root was derived without printing it. `execution_class=remote_command_failure` means the one SSH command exited nonzero; `execution_class=invalid_remote_output` means it exited successfully but did not return a valid managed-release record; `execution_class=success` means the remote command and its managed-release record were valid; and `execution_class=not_attempted` means local input validation stopped before the query. `transfer=absent`, `preparation=absent`, and `activation=absent` are explicit non-mutation evidence. Missing selector or policy fails before remote work; malformed, ambiguous, or mismatched discovery fails closed after that one query. A receipt has no fields for the reviewed commit, activation-script SHA, `current` target, PM2 state, serving health, or caller-side capture: those G.1/G.2 facts and external capture remain unverified until their separate named evidence exists.

`ops/scripts/prepare-release.sh` is the POSIX (`/bin/sh`) preparation stage. Its only inputs are `RELEASE_SHA`, `APP_ROOT`, and the expected owner/group/mode policy. The ordinary handoff quotes and explicitly forwards each input to the remote preparer, invoked from `APP_ROOT/ops/scripts` outside the candidate release directory. It accepts the reviewed `git archive` tar stream on standard input, validates the identity, existing empty target, owner, group, exact mode, and writability before extraction, then runs `npm ci`, `npm run build`, verifies the extracted activation accepts a caller-supplied release SHA, and seals the target. A release directory approved as empty remains empty until preparation begins archive extraction. Every exit emits one timestamped, non-secret `key=value` record; failed `id`, `stat`, extraction, install, build, and seal stages retain their external exit status. Invoke it explicitly with `/bin/sh`; it does not load secrets, invoke `runuser`, PM2, or activation.

After every preceding gate has passed, activate only the prepared candidate by passing the same full SHA both in its sealed path and as the required argument:

```bash
sudo /srv/botanica-ob/releases/<full-candidate-sha>/ops/scripts/activate-pm2-release.sh <full-candidate-sha>
```

The focused local sandbox tests cover the successful preparation path; every pre-extraction guard; late writability failure; activation-ID rejection; and exact failures from `id`, `stat`, extraction, install, build, and sealing. They do not prove a remote handoff, VPS build or sealing, rollback, G.2, or any later runtime gate. G.2 remains NO-GO until a later authorized receipt-only attempt produces the complete captured non-secret receipt named above.

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

- G.2 is inconclusive because the single authorized receipt-only attempt exited nonzero without a captured sanitized stderr receipt. It is NO-GO; no remote operational outcome may be asserted.
- Release identity, remote identity, ownership/mode comparison, and non-mutation fields remain unverified until a captured receipt contains the required contract fields.
- No centralized log aggregation or alerting.
