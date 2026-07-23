# Botánica Esencial OB — Deploy and runbook

How to run the project locally, execute checks, and deploy to the VPS. This document reflects the **current** state of the repo; it does not describe automation that does not exist yet.

## Quick path: local run

1. Start MongoDB:
   ```bash
   docker compose up -d mongo
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
| `TRUSTED_PROXY_HEADERS` | Required in production | `false` | Set to `true` only behind a proxy that overwrites `x-forwarded-for` and `x-real-ip`; production auth fails closed when it is absent. |
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

### Productora provisioning

Provision or recover Olga's laboratory account only through `scripts/create-productora.ts`. It requires these environment variable names:

- `MONGODB_URI`
- `OLGA_EMAIL`
- `OLGA_PASSWORD`

The script requires a valid MongoDB URI, normalizes and validates the email, and requires a password of at least 12 characters before opening MongoDB. It has no localhost fallback, uses bounded connection timeouts, and never prints passwords, hashes, or credential values. Follow the silent interactive password-prompt procedure in [`docs/scripts.md`](./scripts.md#privileged-productora-provisioning); never inline Olga's password or store it in a committed environment file.

Provisioning always writes `role=productora` and `accountStatus=active`, so rerunning it intentionally recovers a suspended Olga account. If Olga is the only active administrator, the script rejects that demotion and leaves her account unchanged.

### Block 5B: standalone MongoDB lease lock for privileged mutations

The admin user mutation route and all privileged scripts that write a role or account status use the same Mongo-backed lease lock. This contract works with the current standalone MongoDB deployment and does not require transactions or a replica set:

- Collection: `mongo_lease_locks`.
- Fixed document: `_id=admin-account-mutations`.
- Ownership: each acquisition uses a random owner token and an atomic `findOneAndUpdate` with `upsert=true` and `returnDocument='after'`.
- Lease: 15 seconds, renewed every 5 seconds while guarded work runs. Renewal is owner-checked; lost ownership raises safely and stale cleanup cannot delete a successor's lease.
- Acquisition: a best-effort 10-second retry budget with 50ms intervals; this is not a hard wall-clock bound. Each Mongo lock command uses `maxTimeMS=2000` and may approach the 10-second Mongo socket timeout while in flight.
- Release: the owner token is included in the delete filter and release runs in `finally`; a different owner cannot release the document.
- Failure: the API returns a safe `503`; provisioning fails without applying its guarded mutation.

Every privileged role/status mutation must use this boundary, including `/api/admin/usuarios`, `create-admin.ts`, `reset-password.ts`, and `create-productora.ts`. Protected callbacks must assert ownership before every write, audit, and rollback, then assert again before returning. The directory read, target read, last-active-admin invariant check, update, audit, and audit rollback must all remain inside the same lease.

## MongoDB startup

`docker-compose.yml` runs MongoDB 7.0 bound to `127.0.0.1:27017` with a persistent Docker volume named `mongo-data`.

```bash
docker compose up -d mongo
```

The container is configured with `restart: unless-stopped`. It has **no authentication** in the local setup; the port is bound to localhost only so it is not exposed to the network.

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
- The custom registration mutation rejects an explicit `Origin` that is neither the request origin nor the configured `NEXTAUTH_URL` origin. Requests without an `Origin` remain compatible with non-browser clients.
- Client IP extraction uses `x-forwarded-for` first and `x-real-ip` as a fallback only when `TRUSTED_PROXY_HEADERS=true`; otherwise both headers are ignored and the limiter uses a stable shared fallback key.
- Production requires `TRUSTED_PROXY_HEADERS=true`; registration returns `503` and credentials login rejects normally until trusted proxy headers are configured.
- These limiters are process-local in memory. They are bounded to 10,000 client keys per limiter and clean expired entries on requests, which fits the current single-VPS process assumption but does not coordinate limits across multiple Node.js processes or replicas. A shared store is required before horizontal scaling.

## VPS deploy (manual, high-level)

There is **no deploy automation** in the repo today. The current manual flow is:

1. **Build on the VPS** (or build locally and copy the `.next/` directory):
   ```bash
   npm ci
   npm run build
   ```
2. **Environment**: create `.env.local` on the VPS with a valid `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `INTERNAL_ACCOUNT_CHECK_ORIGIN=http://127.0.0.1:3000`. Do not commit it. The app rejects an absent or invalid `MONGODB_URI` in production; the account check also fails closed if its value is absent or invalid.
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

- [ ] MongoDB is not running → `docker compose up -d mongo`
- [ ] `NEXTAUTH_SECRET` is missing → the app may build, but login will fail
- [ ] `MONGODB_URI` points to the wrong database → scripts will affect the wrong data
- [ ] `npx tsx` is not available → run `npm install`, then retry the verified local invocation

## Remaining operational gaps

- No automated deploy script or GitHub Action for releases.
- No PM2 ecosystem file.
- No production MongoDB backup or restore runbook.
- No documented health-check endpoint.
- No centralized log aggregation or alerting.
