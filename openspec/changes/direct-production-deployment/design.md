# Design: Direct Production Deployment

## Technical Approach

Use application-readiness and VPS-readiness gates. Build from the lockfile, provision secrets outside Git, and run behind Nginx. Keep authenticated MongoDB on loopback. Expose only email/password authentication in this release; Google OAuth remains unavailable even with configured credentials. Release is **NO-GO** unless dependency, auth, TLS, database, backup/restore, and four-role smoke evidence pass.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Application runtime | PM2 runs `next start` from `/srv/botanica-ob/current`; releases use commit-addressed directories. | Coolify or container | Matches the VPS target and supports atomic symlink rollback. |
| Database topology | Mongo 7 in Docker, persistent and authenticated, published only to `127.0.0.1:27017`; app uses a least-privilege user. | Unauthenticated or public Mongo | Protects user, article, plant, and laboratory data. |
| Health semantics | Unauthenticated `/api/health` returns bounded `200` only when app service and authenticated Mongo ping succeed; no secrets or role data. `/api/admin/health` remains private diagnostics. | Reusing the admin endpoint | Probes need no session and disclose no operational details. |
| Google OAuth release policy | `src/lib/auth/options.ts` imports and registers only `CredentialsProvider`; Google registration and OAuth callback handling are absent, regardless of Google credentials. | Credential-gated or callback-validated activation | Makes the boundary source-enforced; activation requires a future application release. |
| Secrets boundary | A root-readable secret file or manager supplies `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `INTERNAL_ACCOUNT_CHECK_ORIGIN`; Google variables are ignored. | `.env` in Git or command-line passwords | Prevents secret exposure without letting configuration alter supported authentication. |
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
| `src/lib/auth/options.ts`, `src/middleware.ts`, `src/lib/db/connect.ts` | Modify | Credentials-only source, secrets, fail-closed auth, authenticated URI validation. |
| `src/app/api/health/route.ts` | Create | Public liveness/readiness contract. |
| `src/app/api/admin/health/route.ts`, `src/lib/admin/health/*` | Modify | Keep diagnostics private and align probe semantics. |
| `docker-compose.yml` | Modify | Persistent authenticated Mongo with loopback binding. |
| `ops/pm2/ecosystem.config.cjs`, `ops/nginx/botanicasob.conf` | Create | Versioned PM2/Nginx topology; HTTP redirect, TLS termination, loopback proxy, safe timeouts. |
| `ops/scripts/{deploy,rollback,backup-mongo,restore-mongo}.sh` | Create | Validated switching, restricted backups, restore verification, rollback. |
| `docs/runbook.md`, `docs/scripts.md`, `.env.example` | Modify | DNS/acme.sh, secrets, provisioning, monitoring, release, recovery, and exclusions. |
| `tests/` | Add/modify | RED-first contract, integration, release-script, health, and role smoke coverage. |
| VPS resources | Provision | Release directories, secret file, Docker volume, Nginx site, certificate, PM2 startup, restricted backup timer. |

## Interfaces / Contracts

`GET /api/health` returns `{ status: "ok" }` with `200` only when readiness passes; otherwise `{ status: "unavailable" }` with `503`, bounded timeout, `Cache-Control: no-store`, and no internal error text. Auth providers contain credentials only; Google variables MUST NOT add a provider or make Google sign-in accepted. Backups include timestamp, release/database metadata, restricted permissions, and restore-and-ping evidence. The release record includes the matching committed SHA, release directory SHA, activation-script SHA, and `current` target. One-time credential handling records only owner/mode, command status, cleanup status, and other non-secret metadata.

## Testing Strategy

Unit tests cover environment validation, Google policy, health mapping, and rollback safety. The Google-policy test sets valid Google credentials, imports the configuration fresh, asserts a credentials-only provider list, and asserts no Google sign-in path is accepted. Source review verifies `src/lib/auth/options.ts` has no Google registration or credential-gated branch. Integration tests use authenticated Mongo for persistence, restore, and provisioning. Smoke tests cover all four roles and cross-role denial; release tests cover immutable packaging, secret exclusion, health gates, atomic switch, and rollback.

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
