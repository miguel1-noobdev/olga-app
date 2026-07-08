# Scripts operations

One-off TypeScript utilities in `scripts/` for local development, content seeding, and admin tasks.

All scripts read `MONGODB_URI` from the environment and fall back to `mongodb://localhost:27017/botanica-ob` unless noted otherwise.

## Quick path

1. Make sure MongoDB is running (`docker compose up -d mongo`).
2. Ensure `MONGODB_URI` is exported or present in `.env.local`.
3. Run from the repo root:
   ```bash
   npx ts-node scripts/<script-name>.ts
   ```
4. Read the script output carefully before acting on it.

## Script reference

| Script | Purpose | When to use | Command | Warnings |
|--------|---------|-------------|---------|----------|
| `check-articles.ts` | List every article in the database. | Verify published content or debug article counts. | `npx ts-node scripts/check-articles.ts` | Read-only. |
| `check-users.ts` | List every user, role, and password-hash prefix. | Audit accounts after registration or after running user scripts. | `npx ts-node scripts/check-users.ts` | Exposes role and hash prefix; run locally only. |
| `create-admin.ts` | Create or update a hardcoded admin user. | Bootstrap an admin account quickly (legacy helper). | `npx ts-node scripts/create-admin.ts` | Hardcoded email `admin@botanicaob.com` and password `Admin2024!`. Rotate the password immediately after login. |
| `create-admin-proper.ts` | Delete the existing `admin@botanicaob.com` user and recreate it via the repository layer. | Reset the admin account cleanly. | `npx ts-node scripts/create-admin-proper.ts` | **Destructive**: deletes the existing admin user before recreating. Hardcoded password `Admin123!`. |
| `create-test-user.ts` | Create `test@botanica.com` / `Test123!` with role `admin` if missing. | Smoke-test the registration/login flow. | `npx ts-node scripts/create-test-user.ts` | Hardcoded test credentials. Never use in production. |
| `reset-password.ts` | Reset `admin@botanicaob.com` password to `Admin123!`. | Recover admin access. | `npx ts-node scripts/reset-password.ts` | Hardcoded password. Rotate after login. |
| `seed-articles.ts` | Seed three starter articles and publish them. | Populate the blog on a fresh database. | `npx ts-node scripts/seed-articles.ts` | Safe to re-run: skips articles whose slug already exists. |
| `seed-plants.ts` | Sync plant seeds from `seed-plants.data.ts` into the database. | Initialize or refresh the plant catalog. | `npx ts-node scripts/seed-plants.ts` | Upserts by scientific-name slug; existing manual edits may be overwritten. |
| `test-login.ts` | Verify `admin@botanicaob.com` / `Admin123!` and fix the password hash if invalid. | Diagnose login failures. | `npx ts-node scripts/test-login.ts` | Mutates the password hash when the check fails. |

## Supporting files

| File | What it is |
|------|------------|
| `seed-plants.data.ts` | Data module imported by `seed-plants.ts`. Not executable on its own. |
| `tsconfig.json` | Separate TypeScript config for `scripts/`. Used by `npm run typecheck:scripts`. |
| `tsconfig.tsbuildinfo` | Build artifact. Safe to ignore and exclude from commits. |

## Notes

- Scripts output a mix of Spanish and English; this reflects how they were written iteratively and is harmless.
- `npx ts-node` is used because that is what the existing README already references. If `ts-node` is not installed locally, install it globally or add it as a dev dependency.
- `create-admin.ts` is the only script that **does not fall back** to a localhost URI; it exits immediately if `MONGODB_URI` is missing.
- `create-test-user.ts` falls back to `mongodb://localhost:27017/botanica-esencial` (different database name) if `MONGODB_URI` is not set; all other scripts fall back to `botanica-ob`.
- Prefer `create-admin-proper.ts` over `create-admin.ts` for new setups, but remember that both use hardcoded passwords.
