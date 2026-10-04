# Proposal: Direct Production Deployment

## Intent

Make Botánica safe to release directly at `https://botanicaob.duckdns.org` without Coolify. Production must preserve anonymous, subscriber, productora, and admin access boundaries. Email/password remains available, and Google sign-in is offered only when `GOOGLE_OAUTH_ENABLED` is exactly `true` and both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are nonblank after trimming. Identity creation and account matching follow the `user-auth` contract.

## Scope

This change aligns the OpenSpec text with existing application behavior only. Production Google OAuth activation remains postponed; this document change does not authorize or perform it. Enabling `GOOGLE_OAUTH_ENABLED` in production requires separate explicit project-owner release approval and passing evidence for every retained NO-GO gate.

### In Scope
- Production configuration, dependency remediation decision, and explicit email/password, JWT, account, role, and configuration-gated Google sign-in policy.
- Authenticated, persistent, loopback-only MongoDB with backup and restore evidence.
- PM2/Nginx/acme.sh runtime topology, DNS/TLS, health probes, monitoring, release gates, and tested rollback.
- Production smoke evidence for all four access roles and privileged provisioning.

### Out of Scope
- Coolify, e-commerce, ungated Google sign-in, automatic account linking or merging by email, explicit account linking, new product features, and dashboard redesign.
- Email/SMTP delivery and unrelated landing or blog refinements.

## Capabilities

### New Capabilities
- `production-operations`: Defines direct VPS deployment, database protection, probes, backups, release gates, rollback, and role-based production smoke checks.

### Modified Capabilities
- `user-auth`: Reconciles privileged provisioning and production-safe authentication: public registration remains `suscriptora`; email/password remains available; Google sign-in requires the literal enable flag and both credentials nonblank after trimming; identity, role, collision fallback, and linking behavior follows this contract; production role enforcement fails closed.

## Approach

Use separate application-readiness and VPS-readiness gates. First resolve dependency and configuration decisions, including the Google enable-flag and complete-credentials gate and the no-auto-link policy, then define the authenticated Mongo and PM2/Nginx/acme.sh topology. The production activation boundary remains as stated in Scope. Release only an immutable validated build after all existing deployment gates pass, including database readiness, DNS/TLS/ACME, exact-SHA alignment, health, backup/restore, four-role smoke checks, and rollback readiness; keep the change NO-GO otherwise.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `package.json`, lockfile | Modified | Production dependency and release validation decisions. |
| `src/lib/auth/options.ts`, `src/proxy.ts` | Modified | Gated Google and email/password provider policy, secrets, session, and fail-closed roles. |
| `src/lib/db/connect.ts`, `docker-compose.yml` | Modified | Authenticated persistent Mongo topology. |
| `src/app/api/admin/health/route.ts`, `src/lib/admin/health/` | Modified | Separate admin diagnostics from safe operational probes. |
| `docs/runbook.md`, provisioning scripts, VPS PM2/Nginx/acme.sh/Mongo config | Modified | Release, recovery, TLS, backup, and operations runbook. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Unsafe dependency upgrade | Med | Pin compatible fixes and validate build/auth flows. |
| Data loss or exposure | Med | Loopback auth, persistent storage, encrypted secrets, restore test. |
| Bad release or rollback | Med | Versioned release, preflight gates, compatible database rollback. |
| Incorrect Google availability or account linking | Med | Fail closed unless the enable flag and both nonblank credentials are present; test verified identities, subscriber-only creation, linked-account role preservation, and matching-email denial without auto-linking. |

## Rollback Plan

Stop the new PM2 release, restore the prior verified application version and compatible configuration, reload Nginx, and restore Mongo only from a tested backup when data recovery is required. Do not roll back across incompatible schema/data changes without an approved recovery plan.

## Dependencies

- Approved Next.js/NextAuth vulnerability treatment and production secrets.
- VPS Node.js, PM2, Mongo runtime, DNS reachability, Nginx, acme.sh, and backup storage readiness.

## Success Criteria

- [ ] HTTPS serves the validated release; all four role flows enforce their intended access; email/password remains available and Google sign-in requires the literal `GOOGLE_OAUTH_ENABLED=true` plus both credentials nonblank after trimming.
- [ ] The `user-auth` contract governs verified identities, `suscriptora`-only creation, linked-role preservation, and `AccountInUse` manual password fallback without auto-switching or credential prefill; automatic linking/merging and explicit account linking remain unavailable.
- [ ] Mongo authentication, backup/restore, health checks, exact-SHA alignment, TLS/ACME, four-role smoke, and rollback have recorded passing evidence before production activation.
