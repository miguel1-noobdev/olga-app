## Exploration: Direct production deployment readiness

### Current State
Botánica Esencial OB is a single-tenant Next.js App Router application backed by MongoDB and NextAuth. Email/password authentication is exposed to users; Google OAuth is constructed in `authOptions` but intentionally absent from the UI. JWT sessions, active-account checks, and middleware enforce the current access layers: anonymous visitors can use the landing page, subscribers can access `/blog` and `/jardin-digital`, `productora` and `admin` can access `/laboratorio`, and only `admin` can access `/admin`.

The current application evidence is positive but not sufficient for production: `npm run build`, `npm run typecheck:scripts`, and 68 focused authentication, role, middleware, account, and privileged-action tests pass. `npm audit --omit=dev` still reports four vulnerabilities: one critical `next-auth`, two high `next`/`postcss`, and one moderate `uuid` finding.

The deployment state remains **NO-GO**. The repository has no complete release, rollback, PM2, backup/restore, or public operational health contract. The existing health route is admin-protected (`/api/admin/health`) and therefore cannot serve as an unauthenticated process/load-balancer check. The runbook describes a high-level manual flow but explicitly records the missing PM2 ecosystem definition, production Mongo backup runbook, health endpoint, and deployment automation. The VPS currently has active Nginx and Docker, but no `node`, `npm`, `pm2`, or `mongod` commands, no application/Mongo listeners, no enabled Nginx site, no Botanica certificate directory, and no Botanica HTTPS response. Current DNS resolution does return an A record for `botanicasob.duckdns.org` to `212.227.149.125`; DNS is therefore partially present, while TLS and web routing are not.

### Affected Areas
- `package.json` and the lockfile — dependency remediation and explicit production build/start/release checks are required before exposing the application.
- `src/lib/auth/options.ts` and `src/middleware.ts` — production behavior must be explicit for the deferred Google provider, required secrets, JWT sessions, persisted-account checks, and fail-closed role enforcement.
- `src/lib/db/connect.ts` and `docker-compose.yml` — the production Mongo URI, authentication, locality, persistence, startup, and backup strategy must be defined separately from the unauthenticated local Mongo setup.
- `src/app/api/admin/health/route.ts` and `src/lib/admin/health/` — the current report is useful to Admin but is not an external readiness/liveness contract; probes and exposure need separate operational semantics.
- `scripts/create-admin.ts`, `scripts/create-productora.ts`, and `docs/runbook.md` — privileged provisioning, Olga's account, release sequencing, secret handling, and recovery procedures need one production-safe runbook.
- `tests/` — application smoke coverage must be extended from isolated role tests to production-shaped login, anonymous, subscriber, productora, admin, database, health, release, and rollback checks.
- VPS Nginx/PM2/acme.sh/Mongo/backup configuration — the host needs an explicit runtime topology, TLS termination, process supervision, persistence, monitoring, and recovery implementation; none of these should be assumed from the current local files.

### Approaches
1. **Gate-based direct deployment with PM2 and Nginx** — remediate application security/configuration first, define a production health contract, provision authenticated local Mongo with backups, run Next.js under PM2, terminate TLS in Nginx, and release through an immutable versioned procedure with a tested rollback.
   - Pros: matches the project’s stated VPS/PM2 architecture; keeps the public surface small; makes every application and infrastructure prerequisite verifiable before go-live.
   - Cons: requires coordinated application, host, DNS/TLS, database, and operational work; the VPS currently lacks the required Node/PM2/Mongo runtime.
   - Effort: High

2. **Docker Compose deployment behind Nginx** — package the application and Mongo runtime as a host-managed Compose stack while retaining Nginx and acme.sh outside the stack.
   - Pros: Docker is already active on the VPS; application and database versions can be pinned together; host Node/PM2 installation is avoided.
   - Cons: diverges from the documented PM2 target; still requires secrets, health checks, persistent storage, backups, release orchestration, and rollback; introduces container lifecycle and image-management work.
   - Effort: High

### Recommendation
Use the gate-based direct PM2/Nginx approach, with Mongo running as an explicitly authenticated, loopback-only service (Docker may be used for Mongo only if the final design documents its persistence and backup behavior). Split the work into application-readiness and VPS-readiness gates, and keep the deployment **NO-GO** until vulnerability treatment, Google-provider behavior, production environment validation, runtime topology, DNS/TLS, database persistence, health checks, backup/restore, release, and rollback evidence all pass. The proposal should preserve the existing role boundaries rather than treating passing unit tests as proof of production readiness.

### Risks
- Dependency fixes may require a controlled Next.js/NextAuth compatibility decision rather than an unsafe forced upgrade.
- Constructing the deferred Google provider without production credentials may fail at runtime or create an undocumented authentication path; this needs an explicit disabled/configured policy and test.
- A production Mongo URI without authentication, persistence, tested backups, or restore evidence could expose or irreversibly lose user, content, and laboratory data.
- The admin-only health report cannot be reused blindly as a public liveness endpoint; exposing database/auth details would create an information-disclosure risk.
- Missing PM2 release and rollback semantics can leave the site unavailable or roll back application code without matching database compatibility.
- The current A record resolves, but the absent Nginx site, certificate, and HTTPS listener still block public access; IPv6 and DNS propagation should be verified as part of the deployment gate.

### Ready for Proposal
Yes. The proposal should define one outcome-oriented change with separate application and VPS workstreams, explicit NO-GO gates, a rollback plan, and evidence requirements for all four user classes plus database and operational recovery. It should not begin implementation until the maintainer accepts the dependency and runtime decisions.
