# Design: Direct Production Deployment

## Technical Approach

Use application-readiness and VPS-readiness gates. Build from the lockfile, provision secrets outside Git, and run behind Nginx. Keep authenticated MongoDB on loopback. Preserve email/password authentication and offer Google sign-in only when `GOOGLE_OAUTH_ENABLED` is exactly `true` and both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are nonblank after trimming. Accept only verified identities, create new accounts as `suscriptora`, preserve the role of already-linked accounts, and forbid automatic email linking or merging. This documents existing application behavior only; production Google OAuth activation remains postponed, and this document change does not authorize or perform it. Enabling `GOOGLE_OAUTH_ENABLED` in production requires separate explicit project-owner release approval and passing evidence for every retained NO-GO gate. Release remains **NO-GO** unless dependency, auth, exact-SHA, TLS/ACME, database, backup/restore, rollback, and four-role smoke evidence pass.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Application runtime | PM2 runs `next start` from `/srv/botanica-ob/current`; releases use commit-addressed directories. | Coolify or container | Matches the VPS target and supports atomic symlink rollback. |
| Database topology | Mongo 7 in Docker, persistent and authenticated, published only to `127.0.0.1:27017`; app uses a least-privilege user. | Unauthenticated or public Mongo | Protects user, article, plant, and laboratory data. |
| Health semantics | Unauthenticated `/api/health` returns bounded `200` only when app service and authenticated Mongo ping succeed; no secrets or role data. `/api/admin/health` remains private diagnostics. | Reusing the admin endpoint | Probes need no session and disclose no operational details. |
| Google OAuth release policy | Google sign-in requires the literal enable flag and both nonblank-after-trimming credentials; identity and account handling follow the `user-auth` contract, including the `AccountInUse` manual password fallback. | Ungated Google availability, automatic email linking/merging, or role changes on linked sign-in | Keeps provider availability configuration-gated while preserving account and role boundaries. |
| Secrets boundary | A root-readable secret file or manager supplies `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `INTERNAL_ACCOUNT_CHECK_ORIGIN`, `GOOGLE_OAUTH_ENABLED`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. | `.env` in Git or command-line secrets | Keeps sensitive configuration outside Git; Google sign-in still requires the explicit enable flag and both nonblank credentials. |
| Release identity | The committed SHA, sealed release directory SHA, activation-script `RELEASE_ID`, and `current` symlink target must be identical before activation. | Activating a script or symlink that names a different revision | Prevents a build, script, and serving release from drifting apart. |
| Release handoff | A POSIX-compatible SSH wrapper verifies identity and ownership, then invokes the versioned root-only activation script through its shebang. | Bash syntax through `sh`, non-root `runuser`, or masked preflight errors | Keeps the transport layer portable and stops privilege or shell failures before activation. |

## Data Flow

```text
DNS → Nginx :443 (acme.sh certificate) → PM2/Next :3000
                                      → authenticated Mongo :27017 (loopback)
backup timer → mongodump → restricted backup storage
```

Release flow: reconcile the committed SHA, sealed release SHA, activation-script SHA, and `current` target; validate dependencies, build, tests, environment, DNS/TLS, Mongo, backup restore, ACME diagnosis, and release-aligned logs; provision privileged roles; run four-role smoke and denial checks; then switch `current` and start PM2 through the root-only script. Any gate failure stops before activation. Rollback restores the prior release/configuration. Incompatible schema/data rollback is blocked.

## File Changes

| File/resource | Action | Purpose |
|---|---|---|
| `package.json`, `package-lock.json` | Modify | Remediate dependencies and add release, smoke, backup/restore commands. |
| `src/lib/auth/options.ts`, `src/proxy.ts`, `src/lib/db/connect.ts` | Modify | Gated Google and email/password auth policy, secrets, fail-closed roles, authenticated URI validation. |
| `src/app/api/health/route.ts` | Create | Public liveness/readiness contract. |
| `src/app/api/admin/health/route.ts`, `src/lib/admin/health/*` | Modify | Keep diagnostics private and align probe semantics. |
| `docker-compose.yml` | Modify | Persistent authenticated Mongo with loopback binding. |
| `ops/pm2/ecosystem.config.cjs`, `ops/nginx/botanicasob.conf` | Create | Versioned PM2/Nginx topology; HTTP redirect, TLS termination, loopback proxy, safe timeouts. |
| `ops/scripts/{deploy,rollback,backup-mongo,restore-mongo}.sh` | Create | Validated switching, restricted backups, restore verification, rollback. |
| `docs/runbook.md`, `docs/scripts.md`, `.env.example` | Modify | DNS/acme.sh, secrets, provisioning, monitoring, release, recovery, and exclusions. |
| `tests/` | Add/modify | RED-first contract, integration, release-script, health, and role smoke coverage. |
| VPS resources | Provision | Release directories, secret file, Docker volume, Nginx site, certificate, PM2 startup, restricted backup timer. |

## Interfaces / Contracts

`GET /api/health` returns `{ status: "ok" }` with `200` only when readiness passes; otherwise `{ status: "unavailable" }` with `503`, bounded timeout, `Cache-Control: no-store`, and no internal error text. Google sign-in follows the `user-auth` contract: the literal enable flag and both credentials nonblank after trimming are required, and email/password remains available. Account identity, role, collision, and linking behavior is defined by that contract. Backups include timestamp, release/database metadata, restricted permissions, and restore-and-ping evidence. The release record includes the matching committed SHA, release directory SHA, activation-script SHA, and `current` target. One-time credential handling records only owner/mode, command status, cleanup status, and other non-secret metadata.

## Testing Strategy

Unit tests cover trimmed credential validation, Google policy, health mapping, and rollback safety. Google-policy tests verify the literal `GOOGLE_OAUTH_ENABLED=true` gate plus nonblank-after-trimming `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, while email/password remains available when Google is disabled or incompletely configured. Identity tests cover the `user-auth` contract, including verified identities, `suscriptora`-only creation, linked-role preservation, and manual password fallback for `AccountInUse` without auto-switching or credential prefill. Integration tests use authenticated Mongo for persistence, restore, and provisioning. Smoke tests cover all four roles and cross-role denial; release tests cover immutable packaging, secret exclusion, health gates, atomic switch, and rollback.

## Threat Matrix

| Boundary | Applicability / response / RED test |
|---|---|
| Documentation-like paths | **N/A** — deployment does not classify repository files as executable. |
| Git repository selection | **N/A** — deployment does not select repositories or interpret repository/root selectors. |
| Commit state | **N/A** — deployment consumes an already selected commit; it does not stage or create commits. |
| Push state | **N/A** — no push automation. |
| PR commands | **N/A** — no PR automation; force-chained delivery is orchestrator policy. |

## Migration / Rollout

No data migration is planned. Run VPS checks first, then DNS/TLS and production release. Keep the prior release and one verified backup until smoke passes.

## Open Questions

- [ ] **Blocking:** Which approved dependency remediation/version is acceptable for the reported Next.js/NextAuth vulnerabilities?
- [ ] **Blocking:** Where is the encrypted off-host backup destination, and what retention/RPO/RTO are required?
- [ ] **Blocking:** Which operator-owned secret mechanism and Unix account should own PM2, releases, and the Mongo backup timer?
- [ ] **Blocking:** What is the diagnosed cause and approved remediation for the failed ACME test?
- [ ] **Blocking:** What release-aligned role, denial, and log evidence proves the candidate SHA after every gate passes?
