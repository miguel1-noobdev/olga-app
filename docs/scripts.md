# Scripts operations

One-off TypeScript utilities in `scripts/` for local development, content seeding, and admin tasks.

Each script documents its own configuration requirements. The secured privileged scripts never fall back to a local database or embedded credentials.

## Quick path

1. Make sure MongoDB is running (`docker compose up -d mongo`).
2. Ensure `MONGODB_URI` is exported or present in `.env.local`.
3. Run from the repo root:
   ```bash
   npx tsx scripts/<script-name>.ts
   ```
4. Read the script output carefully before acting on it.

## Privileged admin scripts

`create-admin.ts` and `reset-password.ts` require all of these environment variable names:

- `MONGODB_URI`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Load the values through the deployment secret store or a password manager-backed shell session. Do not place them in source files, command history, or committed environment files. Run the selected script only after the variables are present in its process environment, then clear them. The scripts reject missing or malformed values before opening a database connection and do not print credentials.

For a local one-off run in zsh, load `MONGODB_URI` and `ADMIN_EMAIL` from an ignored, owner-readable environment file that does not contain a password. Then prompt for the password separately so it is not recorded in shell history:

```bash
set -a
. ./.env.admin.local
set +a
read -r -s 'ADMIN_PASSWORD?Admin password: '
printf '\n'
export ADMIN_PASSWORD
npx tsx scripts/create-admin.ts
unset ADMIN_PASSWORD
```

Use `scripts/reset-password.ts` in the final command when recovering access. Keep `.env.admin.local` out of version control and remove the exported password immediately after the script finishes.

## Privileged productora provisioning

`create-productora.ts` is the explicit provisioning and recovery path for Olga's laboratory account. It requires all of these environment variable names:

- `MONGODB_URI`
- `OLGA_EMAIL`
- `OLGA_PASSWORD`

The script rejects missing values, malformed MongoDB URIs, invalid email addresses, and passwords shorter than 12 characters before opening a database connection. It normalizes the email address, uses bounded MongoDB connection timeouts, hashes the password with bcrypt, and never prints the password, password hash, or credential values. There is no localhost MongoDB fallback.

When Olga's account already exists, the script intentionally recovers it by setting both `role=productora` and `accountStatus=active`; this includes suspended accounts. New accounts receive the same explicit role and active status.

For a local one-off run in zsh, load `MONGODB_URI` and `OLGA_EMAIL` from an ignored, owner-readable environment file and prompt for Olga's password separately:

```bash
set -a
. ./.env.olga.local
set +a
read -r -s 'OLGA_PASSWORD?Olga password: '
printf '\n'
export OLGA_PASSWORD
npx tsx scripts/create-productora.ts
unset OLGA_PASSWORD
```

Keep `.env.olga.local` out of version control. The script's recovery behavior is separate from concurrent last-active-admin protection, which remains a Block 5B follow-up.

## Script reference

| Script | Purpose | When to use | Command | Warnings |
|--------|---------|-------------|---------|----------|
| `check-articles.ts` | List every article in the database. | Verify published content or debug article counts. | `npx tsx scripts/check-articles.ts` | Read-only. |
| `check-users.ts` | List every user, role, and password-hash prefix. | Audit accounts after registration or after running user scripts. | `npx tsx scripts/check-users.ts` | Exposes role and hash prefix; run locally only. |
| `create-admin.ts` | Create or update the designated admin account. | Explicitly provision the first admin or recover staff administration. | `npx tsx scripts/create-admin.ts` | Requires `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Safe to re-run for the designated account. |
| `create-productora.ts` | Create or recover Olga's laboratory account with the active `productora` role. | Explicitly provision Olga or recover a suspended Olga account. | `npx tsx scripts/create-productora.ts` | Requires `MONGODB_URI`, `OLGA_EMAIL`, and `OLGA_PASSWORD`; 12-character minimum; no localhost fallback; prompt silently for the password. |
| `reset-password.ts` | Reset the designated admin password. | Recover admin access. | `npx tsx scripts/reset-password.ts` | Requires `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. |
| `seed-articles.ts` | Seed three starter articles and publish them. | Populate the blog on a fresh database. | `npx tsx scripts/seed-articles.ts` | Safe to re-run: skips articles whose slug already exists. |
| `seed-plants.ts` | Sync plant seeds from `seed-plants.data.ts` into the database. | Initialize or refresh the plant catalog. | `npx tsx scripts/seed-plants.ts` | Upserts by scientific-name slug; existing manual edits may be overwritten. |

## Supporting files

| File | What it is |
|------|------------|
| `seed-plants.data.ts` | Data module imported by `seed-plants.ts`. Not executable on its own. |
| `tsconfig.json` | Separate TypeScript config for `scripts/`. Used by `npm run typecheck:scripts`. |
| `tsconfig.tsbuildinfo` | Build artifact. Safe to ignore and exclude from commits. |

## Notes

- Scripts output a mix of Spanish and English; this reflects how they were written iteratively and is harmless.
- Run TypeScript scripts with `npx tsx`; this is the verified local invocation.
- `create-admin.ts` and `reset-password.ts` are the approved admin provisioning path. They require `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` and never use a fallback URI.
- `create-productora.ts` is the approved Olga provisioning path. It requires `MONGODB_URI`, `OLGA_EMAIL`, and `OLGA_PASSWORD`, never uses a fallback URI, and explicitly restores Olga to active `productora` status.
