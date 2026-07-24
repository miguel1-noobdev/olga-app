# Botánica Esencial OB — Deploy and runbook

How to run the project locally, execute checks, and deploy to the VPS. This document reflects the **current** state of the repo; it does not describe automation that does not exist yet.

## Quick path: local run

1. Copy and extend the environment file:
   ```bash
   cp .env.example .env.local
   ```
   Set the local `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`, and `MONGODB_URI` values from the authenticated example, then add at least `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `INTERNAL_ACCOUNT_CHECK_ORIGIN` (see [Required environment variables](#required-environment-variables)).
2. Start MongoDB:
   ```bash
   docker compose --env-file .env.local up -d mongo
   ```
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
| `MONGODB_URI` | Yes in every runtime | Authenticated local, private Coolify, or external managed MongoDB URI | The application and all scripts fail before connecting when this variable is missing or invalid. There is no localhost fallback. |
| `NEXTAUTH_SECRET` | At runtime | Generate with `openssl rand -base64 32` | NextAuth JWT signing secret. Login will fail without it. |
| `NEXTAUTH_URL` | Required for browser mutations | `http://localhost:3000` | Used by NextAuth for callback URLs and as the validated canonical origin for custom mutation APIs. |
| `TRUSTED_PROXY_HEADERS` | Required in production | `false` | Set to `true` only behind a proxy that overwrites trusted forwarded headers, including host/protocol; production auth and custom mutations fail closed when it is absent. |
| `INTERNAL_ACCOUNT_CHECK_ORIGIN` | At runtime | `http://127.0.0.1:3000` | Trusted origin for middleware's persisted-account check. Use the loopback Next.js listener on the VPS, or a bare HTTPS origin. HTTP is accepted only for `localhost`, `127.0.0.1`, or `[::1]`. |
| `GOOGLE_CLIENT_ID` | Only if enabling Google OAuth | Google Cloud Console | Google auth is wired but **not exposed in the UI**. |
| `GOOGLE_CLIENT_SECRET` | Only if enabling Google OAuth | Google Cloud Console | Never commit this value. |

> **Current reality:** `.env.example` contains placeholders for an authenticated local MongoDB and loopback account-check settings. Replace local placeholders before starting Compose; never commit the resulting `.env.local`.

### Privileged admin provisioning

The first public registration never becomes an administrator. Provision or recover an administrator only through `scripts/create-admin.ts` or `scripts/reset-password.ts` with these required environment variable names:

- `MONGODB_URI`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Use a password manager or the deployment secret store. For local one-off work in zsh, follow the silent interactive password-prompt procedure in [`docs/scripts.md`](./scripts.md#privileged-admin-scripts) and run the selected script with `npx tsx`; never inline a password in a shell command or save it in a committed environment file. Both scripts fail before connecting when a required value is absent or invalid and never print credentials.

### Productora provisioning

Provision or recover Olga's laboratory account only through `scripts/create-productora.ts`. It requires these environment variable names:

- `MONGODB_URI`
- `OLGA_EMAIL`
- `OLGA_PASSWORD`

The script requires a valid MongoDB URI, normalizes and validates the email, and requires a password of at least 12 characters before opening MongoDB. It has no localhost fallback, uses bounded connection timeouts, and never prints passwords, hashes, or credential values. Follow the silent interactive password-prompt procedure in [`docs/scripts.md`](./scripts.md#privileged-productora-provisioning); never inline Olga's password or store it in a committed environment file.

Provisioning always writes `role=productora` and `accountStatus=active`, so rerunning it intentionally recovers a suspended Olga account. If Olga is the only active administrator, the script rejects that demotion and leaves her account unchanged.

### Block 5B: retained lease-lock and compensating-rollback topology

The admin user mutation route and all privileged scripts that write a role or account status use the same Mongo-backed lease lock. Block 11 retains this privileged-mutation model: Mongo lease locking plus compensating rollback. It does not migrate the current guarded-mutation semantics to MongoDB sessions or transactions.

- Collection: `mongo_lease_locks`.
- Fixed document: `_id=admin-account-mutations`.
- Ownership: each acquisition uses a random owner token and an atomic `findOneAndUpdate` with `upsert=true` and `returnDocument='after'`.
- Lease: 15 seconds, renewed every 5 seconds while guarded work runs. Renewal is owner-checked; lost ownership raises safely and stale cleanup cannot delete a successor's lease.
- Acquisition: a best-effort 10-second retry budget with 50ms intervals; this is not a hard wall-clock bound. Each Mongo lock command uses `maxTimeMS=2000` and may approach the 10-second Mongo socket timeout while in flight.
- Release: the owner token is included in the delete filter and release runs in `finally`; a different owner cannot release the document.
- Failure: the API returns a safe `503`; provisioning fails without applying its guarded mutation.

Every privileged role/status mutation must use this boundary, including `/api/admin/usuarios`, `create-admin.ts`, `reset-password.ts`, and `create-productora.ts`. Protected callbacks must assert ownership before every write, audit, and rollback, then assert again before returning. The directory read, target read, last-active-admin invariant check, update, audit, and audit rollback must all remain inside the same lease.

True multi-document MongoDB transactions are a separate future change. A replica set alone is not sufficient for the current code: the application would also need an explicit session/transaction implementation and new failure semantics. Do not enable a replica set as an implied Block 11 migration.

## MongoDB deployment contract

The application requires an explicit, valid `MONGODB_URI` in local development, tests that exercise database access, Coolify/private production, and external managed MongoDB. The runtime resolver preserves the exact URI, including encoded credentials and query options such as `authSource`; it never supplies a hardcoded local default.

### Local authenticated MongoDB

- `docker-compose.yml` publishes MongoDB only as `127.0.0.1:27017:27017`; it is not a network-facing service.
- Compose requires `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` through environment substitution. `.env.example` contains placeholders only.
- Use a URI such as `mongodb://USER:PASSWORD@127.0.0.1:27017/botanica-ob?authSource=admin` in `.env.local`.
- URL-encode MongoDB usernames and passwords before placing them in a URI. Characters such as `@`, `:`, `/`, `?`, `#`, and `%` must not be copied raw into credentials.

### Coolify/private production MongoDB

- Keep MongoDB on a private internal network or private service; do not publish port `27017` publicly.
- Set `MONGODB_URI` as a Coolify secret, using a dedicated production credential and the correct database plus `authSource` (usually `admin` for a root-created user, or the user database for a database-scoped user).
- The app rejects a missing or invalid URI before connecting. A production process never falls back to localhost or local Compose credentials.

### External managed MongoDB

- Use the provider's `mongodb+srv://` URI, restricted network access, TLS defaults, and a least-privilege database user.
- Store the complete URI only in the deployment secret store. URL-encode credentials and retain the provider's required `authSource` and other query parameters unchanged.

### Existing local volume migration

MongoDB initialization variables apply only when the data directory is initialized. Do not assume an existing unauthenticated `mongo-data` volume becomes authenticated when these variables are added.

Before changing an existing local volume, take a verified `mongodump` backup outside Docker, record the database and collection list, stop dependent application processes, and preserve the dump. Create a fresh authenticated volume/container, verify login with the new URI, restore with `mongorestore`, and only then repoint the app. Keep the old volume untouched until the restored data is verified; never run a destructive volume removal as an automatic migration.

## MongoDB startup

`docker-compose.yml` runs MongoDB 7.0 bound to `127.0.0.1:27017` with a persistent Docker volume named `mongo-data`.

```bash
docker compose --env-file .env.local up -d mongo
```

The container is configured with `restart: unless-stopped` and local authentication. If an older unauthenticated volume is present, follow the backup and fresh-volume procedure above instead of assuming the Compose change upgrades it.

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
2. `npm run lint`
3. `npm run build`
4. `npm run test:run`
5. `npm run typecheck:scripts`

The workflow uses Node.js 20 and the `npm` cache.

## Auth reality

- **Email and password** is the only login path exposed to end users in the UI.
- **Google OAuth** is configured in `src/lib/auth/options.ts` but intentionally **not shown in the UI**. It stays disabled until the brand owner explicitly decides to turn it on.
- Roles exist (`suscriptora`, `productora`, `admin`). Public registration creates only `suscriptora` accounts.
- `productora` and `admin` are staff roles for the Laboratorio; `admin` retains staff support access to Olga's Laboratorio.

### Public auth perimeter

- Registration is limited to 5 requests per client IP per 15-minute sliding window and returns `429` with a safe `Retry-After` header when the limit is exceeded.
- Credentials login is limited to 10 attempts per client IP per 15-minute sliding window. NextAuth continues to return its normal credentials failure result when the limit is exceeded, preserving the existing login UX and built-in CSRF flow.
- The custom registration mutation requires an explicit, well-formed `Origin` matching the validated `NEXTAUTH_URL` origin or the effective request origin. Missing, malformed, and mismatched origins are rejected before database work.
- Client IP extraction uses `x-forwarded-for` first and `x-real-ip` as a fallback only when `TRUSTED_PROXY_HEADERS=true`; otherwise both headers are ignored and the limiter uses a stable shared fallback key.
- Production requires `TRUSTED_PROXY_HEADERS=true`; registration returns `503` and credentials login rejects normally until trusted proxy headers are configured.
- These limiters are process-local in memory. They are bounded to 10,000 client keys per limiter and clean expired entries on requests, which fits the current single-VPS process assumption but does not coordinate limits across multiple Node.js processes or replicas. A shared store is required before horizontal scaling.

### Block 6: custom mutation origin policy

The shared strict origin policy in `src/lib/auth/request-security.ts` applies to these custom browser mutation handlers:

- `POST /api/auth/register`
- `POST /api/admin/articles`
- `PATCH /api/admin/articles/[id]`
- `PATCH /api/admin/usuarios`
- `POST /api/admin/botanico/[catalog]`

The policy requires a non-empty bare `Origin` header and validates it against `NEXTAUTH_URL` plus the effective request origin. `x-forwarded-host` and `x-forwarded-proto` affect that effective origin only when `TRUSTED_PROXY_HEADERS=true`; arbitrary forwarded origin data is ignored when trust is disabled. Invalid canonical configuration and malformed trusted forwarded origin data fail closed. Missing or mismatched `Origin` headers return the stable `Invalid request origin` response; missing production proxy trust returns `503` for registration before origin validation and `403` for the other custom mutation handlers. There are no custom `DELETE` handlers in this scope.

Safe `GET` handlers and NextAuth's built-in authentication endpoints are excluded. Next.js 14 Server Actions remain protected by the framework's host/origin checks; they are not custom route handlers in this block, and no `Origin` value is passed through Server Action arguments. `next.config.mjs` does not define dynamic `serverActions.allowedOrigins`; no wildcard origin is permitted.

### Block 7: runtime input contracts

Custom JSON mutations use `src/lib/validation/runtime-input.ts` before database
connection or repository calls. The boundary requires `Content-Type: application/json`
with an optional charset, reads the actual request bytes, rejects bodies larger than
1 MiB with `413`, and returns stable `400` responses for malformed JSON, non-object
roots, unknown fields, invalid strings, arrays, numbers, dates, enums, image URLs,
and Mongo ObjectIds. Image URLs may be `https`, `http`, or approved local `/img/`
paths; executable and data protocols are rejected.

The contract is applied to:

- `POST /api/auth/register`
- `POST /api/admin/articles`
- `PATCH /api/admin/articles/[id]`
- `POST /api/admin/botanico/[catalog]`
- `PATCH /api/admin/usuarios`
- Laboratory notes, formulas, and lot server actions under `src/app/laboratorio/**/actions.ts`

Domain payloads are allowlisted and bounded, including article content, botanical
nested entries and image lists, formula phases/procedure/evaluation/use-test/INCI
blocks, lot grams/dates/observations, and notes. Existing role, account-status,
formula-status, and lot-status allowlists remain authoritative. Mongoose cast and
validation failures are converted to stable client errors rather than exposing raw
persistence messages.

This section documents input contracts only. Deployment and VPS provisioning remain pending.

### Block 8: server-action and form resilience

The seven laboratory server actions use a single safe failure boundary covering authentication,
MongoDB connection, repository lookup, and repository mutation work. They preserve their existing
authorization, validation, field-error, redirect, and success contracts. Recognized persistence
input failures return `Entrada inválida`; unexpected failures return stable retryable messages and
never return raw database or repository error details to the browser.

The formula and lot forms always settle their disabled state through `try/catch/finally`. Plant and
oil notes forms catch rejected server-action promises and announce a safe generic error while
`useTransition` settles. Login, registration, and article creation expose errors through accessible
alerts. User-management mutations disable concurrent controls and announce a safe generic failure.
The existing content-action behavior is unchanged.

Block 9 loading and error boundaries remains pending and is not part of this contract.

## VPS deploy (manual, high-level)

There is **no deploy automation** in the repo today. The current manual flow is:

1. **Build on the VPS** (or build locally and copy the `.next/` directory):
   ```bash
   npm ci
   npm run build
   ```
2. **Environment**: create `.env.local` on the VPS with a valid `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `TRUSTED_PROXY_HEADERS=true`, and `INTERNAL_ACCOUNT_CHECK_ORIGIN=http://127.0.0.1:3000`. Do not commit it. The app rejects an absent or invalid `MONGODB_URI` before connecting; the account check also fails closed if its value is absent or invalid. Without trusted proxy headers, registration returns `503` and custom mutation handlers return `403`.
3. **Database**: make sure MongoDB is reachable from the app process (local Docker container, managed Atlas cluster, etc.).
4. **Process manager**: start the app with PM2, for example:
   ```bash
   pm2 start npm --name "botanica-ob" -- start
   ```
   (No PM2 ecosystem file exists yet.)
5. **Reverse proxy**: configure Nginx to proxy traffic to `localhost:3000` and to cache static assets.
6. **SSL**: use `acme.sh` (already installed on the VPS) to obtain and renew certificates for the domain.
7. **Logs**: inspect with `pm2 logs botanica-ob` and `journalctl -u nginx`.

## What is intentionally not deployed

| Path / file | Why it stays out |
|-------------|------------------|
| `ideas/` | Planning documents, UI references, and historical design explorations. Not part of the application. |
| `tests/` | Test code; not needed at runtime. |
| `.env*.local`, `.env` | Secrets and local configuration; never committed. |
| `img/WhatsApp Image*.jpeg` | Local reference captures from Olga's notebook; ignored by `.gitignore`. |

## Common issues checklist

- [ ] Local MongoDB is not running → `docker compose --env-file .env.local up -d mongo`
- [ ] `NEXTAUTH_SECRET` is missing → the app may build, but login will fail
- [ ] `MONGODB_URI` points to the wrong database → scripts will affect the wrong data
- [ ] `npx tsx` is not available → run `npm install`, then retry the verified local invocation

## Remaining operational gaps

- No automated deploy script or GitHub Action for releases.
- No PM2 ecosystem file.
- No production MongoDB backup or restore runbook.
- No documented health-check endpoint.
- No centralized log aggregation or alerting.
