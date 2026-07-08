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
   Add at least `NEXTAUTH_SECRET` and `NEXTAUTH_URL` (see [Required environment variables](#required-environment-variables)).
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
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/botanica-ob` | Used by the app and by all `scripts/`. |
| `NEXTAUTH_SECRET` | At runtime | Generate with `openssl rand -base64 32` | NextAuth JWT signing secret. Login will fail without it. |
| `NEXTAUTH_URL` | Recommended | `http://localhost:3000` | Used by NextAuth for callback URLs. |
| `GOOGLE_CLIENT_ID` | Only if enabling Google OAuth | Google Cloud Console | Google auth is wired but **not exposed in the UI**. |
| `GOOGLE_CLIENT_SECRET` | Only if enabling Google OAuth | Google Cloud Console | Never commit this value. |

> **Current reality:** `.env.example` only lists `MONGODB_URI`. Copy it and add the other variables manually for local development or production.

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
2. `npm run build`
3. `npm run test:run`
4. `npm run typecheck:scripts`

The workflow uses Node.js 20 and the `npm` cache.

## Auth reality

- **Email and password** is the only login path exposed to end users in the UI.
- **Google OAuth** is configured in `src/lib/auth/options.ts` but intentionally **not shown in the UI**. It stays disabled until the brand owner explicitly decides to turn it on.
- Roles exist (`suscriptora`, `productora`, `admin`), but today only `suscriptora` and `admin` are exercised in the UI.
- The **first user registered through `/register`** automatically receives the `admin` role.

## VPS deploy (manual, high-level)

There is **no deploy automation** in the repo today. The current manual flow is:

1. **Build on the VPS** (or build locally and copy the `.next/` directory):
   ```bash
   npm ci
   npm run build
   ```
2. **Environment**: create `.env.local` on the VPS with at least `MONGODB_URI`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`. Do not commit it.
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
- [ ] `npx ts-node` is not available → install `ts-node` globally or add it as a dev dependency

## Remaining operational gaps

- No automated deploy script or GitHub Action for releases.
- No PM2 ecosystem file.
- No production MongoDB backup or restore runbook.
- No documented health-check endpoint.
- No centralized log aggregation or alerting.
