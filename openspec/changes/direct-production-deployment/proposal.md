# Proposal: Direct Production Deployment

## Intent

Make Botánica safe to release directly at `https://botanicaob.duckdns.org` without Coolify. Production must preserve anonymous, subscriber, productora, and admin access boundaries, with email/password as the only supported authentication method. Google OAuth must remain disabled regardless of credential presence.

## Scope

### In Scope
- Production configuration, dependency remediation decision, and explicit email/password, JWT, account, role, and Google-OAuth-disabled policy.
- Authenticated, persistent, loopback-only MongoDB with backup and restore evidence.
- PM2/Nginx/acme.sh runtime topology, DNS/TLS, health probes, monitoring, release gates, and tested rollback.
- Production smoke evidence for all four access roles and privileged provisioning.

### Out of Scope
- Coolify, e-commerce, Google OAuth activation or credential-based enablement, new product features, and dashboard redesign.
- Email/SMTP delivery and unrelated landing or blog refinements.

## Capabilities

### New Capabilities
- `production-operations`: Defines direct VPS deployment, database protection, probes, backups, release gates, rollback, and role-based production smoke checks.

### Modified Capabilities
- `user-auth`: Reconciles privileged provisioning and production-safe authentication: public registration remains `suscriptora`; email/password is the only supported method; Google OAuth remains disabled regardless of configured credentials; production role enforcement fails closed.

## Approach

Use separate application-readiness and VPS-readiness gates. First resolve dependency and configuration decisions, including a provider policy that excludes Google OAuth even when Google credentials exist, then define the authenticated Mongo and PM2/Nginx/acme.sh topology. Release only an immutable validated build after DNS, TLS, health, backup/restore, and four-role smoke checks pass; keep the change NO-GO otherwise.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `package.json`, lockfile | Modified | Production dependency and release validation decisions. |
| `src/lib/auth/options.ts`, `src/middleware.ts` | Modified | Credentials-only provider, secret, session, and fail-closed role policy. |
| `src/lib/db/connect.ts`, `docker-compose.yml` | Modified | Authenticated persistent Mongo topology. |
| `src/app/api/admin/health/route.ts`, `src/lib/admin/health/` | Modified | Separate admin diagnostics from safe operational probes. |
| `docs/runbook.md`, provisioning scripts, VPS PM2/Nginx/acme.sh/Mongo config | Modified | Release, recovery, TLS, backup, and operations runbook. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Unsafe dependency upgrade | Med | Pin compatible fixes and validate build/auth flows. |
| Data loss or exposure | Med | Loopback auth, persistent storage, encrypted secrets, restore test. |
| Bad release or rollback | Med | Versioned release, preflight gates, compatible database rollback. |
| Accidental Google OAuth activation | Low | Exclude the Google provider regardless of credentials and verify credentials-only production authentication. |

## Rollback Plan

Stop the new PM2 release, restore the prior verified application version and compatible configuration, reload Nginx, and restore Mongo only from a tested backup when data recovery is required. Do not roll back across incompatible schema/data changes without an approved recovery plan.

## Dependencies

- Approved Next.js/NextAuth vulnerability treatment and production secrets.
- VPS Node.js, PM2, Mongo runtime, DNS reachability, Nginx, acme.sh, and backup storage readiness.

## Success Criteria

- [ ] HTTPS serves the validated release; all four role flows enforce their intended access; email/password is the only supported sign-in method.
- [ ] Google OAuth remains disabled when valid Google credentials are present.
- [ ] Mongo authentication, backup/restore, health checks, release, and rollback have recorded passing evidence.
