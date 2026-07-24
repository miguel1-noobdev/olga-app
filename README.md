# Botánica Esencial OB

Single-tenant informational platform for a handcrafted natural cosmetics brand. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, MongoDB, and NextAuth.js.

This is **not an e-commerce site**. It explains the brand, shares content with registered subscribers, and gives the owner a lightweight admin flow for publishing articles.

## Current implemented scope

- **Landing page** with nine sections: Hero, Products, Methods, Diario (blog preview), Glosario preview, Olga profile, Sign-up, Social links, Footer.
- **Email/password authentication**: registration, login, logout, role-based access.
- **Subscriber-only areas**: `/blog` and `/jardin-digital` are protected by middleware; anonymous visitors are redirected to `/login`.
- **Admin area**: `/admin` and `/admin/blog/nuevo` are restricted to the explicitly provisioned `admin` role.
- **Article publishing**: simple creation form at `/admin/blog/nuevo` that publishes immediately. No drafts, no edit flow yet.
- **MongoDB storage** for users, articles, and plants, with in-memory MongoDB for tests.
- **CI pipeline** via GitHub Actions: install, build, test, and script typecheck.

## Auth reality

- **Email and password is the only working login path for end users.**
- Google OAuth is wired in NextAuth config but intentionally **not exposed in the UI**. It remains deferred until the brand owner explicitly enables it.
- Roles exist (`suscriptora`, `productora`, `admin`), but today only `suscriptora` and `admin` are exercised in the UI.
- Public registration creates `suscriptora` accounts only. The first admin is provisioned explicitly through the secured admin script.
- `admin` retains staff support access to the Laboratorio alongside `productora`.

## Blog reality

- The blog is visible **only to registered users**.
- The landing page shows the **latest 3 published articles** in the Diario section.
- The blog welcome page shows the **latest 2 published articles**.
- All articles are published immediately from the admin form; there is no draft or scheduled state.

## Admin / content reality

- Admin can create a new article at `/admin/blog/nuevo`.
- Articles are saved and published immediately.
- There is **no edit, no delete, and no draft workflow** yet.
- Content is stored as Markdown-like plain text and rendered safely (no `dangerouslySetInnerHTML`).

## Operating model note

- Phase 1 is closed functionally. Landing, blog, `/jardin-digital`, and email/password auth are accepted as first versions; Google OAuth, registration UX polish, and landing aesthetic tweaks are deferred.
- `/admin/blog/*` is a **temporary** article-creation tool. Its long-term home is the real admin dashboard (Phase 4).
- `plantas` is the full source-of-truth plant domain; `/jardin-digital` is only the public-facing projection of part of that domain.
- See [`ideas/designUI/CONTEXTO_PLATAFORMA.md`](./ideas/designUI/CONTEXTO_PLATAFORMA.md) for the full product context and remapped phases.

## Local development

### Requirements

- Node.js 20
- Docker or Docker Desktop

Copy `.env.example` to `.env.local` if you have not already, then add the extra variables required for NextAuth:

```bash
cp .env.example .env.local
```

`MONGODB_URI` is required explicitly in every runtime. See [`docs/runbook.md`](./docs/runbook.md#required-environment-variables) for the local, Coolify, and external managed MongoDB contracts.

### Start MongoDB

```bash
docker compose --env-file .env.local up -d mongo
```

This binds authenticated MongoDB to `127.0.0.1:27017` with a persistent volume. Replace the local credential placeholders before starting Compose.

### Useful commands

```bash
npm run dev              # Start the Next.js dev server
npm run build            # Production build
npm run test:run         # Run the Vitest suite once
npm run typecheck:scripts # Type-check files under scripts/
```

> For the full local/deploy runbook see [`docs/runbook.md`](./docs/runbook.md). For a detailed scripts reference see [`docs/scripts.md`](./docs/scripts.md).

### Provision an admin user

Public registration never grants administrative access. Use `scripts/create-admin.ts` only after its required `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` variables have been loaded through a secret-safe environment. From zsh, invoke privileged scripts with `npx tsx` and use the silent password prompt documented in [`docs/scripts.md`](./docs/scripts.md); never put a password in a command line or environment file.

## CI

A GitHub Actions workflow runs on every push and pull request to `main`/`master`:

1. `npm ci`
2. `npm run build`
3. `npm run test:run`
4. `npm run typecheck:scripts`

## Project layout

```
olga-app/
├── .github/workflows/   # CI
├── ideas/               # Planning and design references (NOT deployed)
├── img/                 # Official image gallery
├── scripts/             # One-off admin/utility scripts
├── src/                 # Next.js application source
│   ├── app/             # App Router pages and API routes
│   ├── components/      # React components
│   ├── lib/             # Auth, DB models, repositories
│   └── middleware.ts    # Route protection
└── tests/               # Vitest tests
```

`ideas/` contains planning documents, UI references, and historical design explorations. It is **not part of the deployed application** and should be excluded from any production upload.

## See also

- [`AGENTS.md`](./AGENTS.md) — Rules for AI agents working on this repository.
- [`docs/runbook.md`](./docs/runbook.md) — Local run, deploy, and operational reference.
- [`docs/scripts.md`](./docs/scripts.md) — What each script does and how to run it.
- [`ideas/designUI/CONTEXTO_PLATAFORMA.md`](./ideas/designUI/CONTEXTO_PLATAFORMA.md) — Full product context and long-term vision (Spanish, planning-only).
