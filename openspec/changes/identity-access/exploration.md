# Identity and Access Exploration

## Exploration: identity-access

### Current State

The application has a working but production-incomplete credentials flow built on NextAuth.js 4.24.15, JWT sessions, MongoDB/Mongoose, and bcrypt. `POST /api/auth/register` creates a `suscriptora` record immediately, returns a generic `202` response for both new and duplicate addresses, and has no email-verification state or delivery step. `UserModel` requires `passwordHash` and currently allows only `active` or `suspended` account status. Credentials authorization accepts only active users.

The deployed-source direction is deliberately explicit about privileged roles: public registration defaults to `suscriptora`, while Admin and Olga are provisioned or recovered through controlled scripts. The current repository and tests confirm that the old first-user-admin idea is not current behavior. `authOptions` currently registers only `CredentialsProvider`; Google OAuth is deferred and its earlier provisioning tests are now negative-policy evidence, not an implementation to extend blindly.

JWT claims contain user id and role, while `src/proxy.ts` performs a signed internal account lookup before allowing blog, garden, laboratory, or admin routes. This is a useful persisted-status guard, but it has no password/session version check. There is no password recovery, password change, email verification, email sender, token collection, rate limiter, login lockout, auth audit trail, or auth-specific observability contract. `.env.example` contains database and internal account-check settings only. Existing admin recovery scripts force `admin` and `active`, which is appropriate for narrowly controlled recovery but not a general user-facing reset flow.

The public auth UX is Spanish and currently offers registration and credentials login. Registration redirects to login after the API accepts the request; login has no recovery link or Google action. Protected-route redirects preserve a sanitized callback URL, and existing HTTP tests exercise the three roles, status denial, and protected route boundaries. Vitest with MongoMemoryServer is the established test foundation, including real Next.js HTTP coverage.

### Affected Areas

- `src/lib/db/models/user.ts` — extend lifecycle and verification state without allowing unverified accounts to authenticate; preserve the existing role values.
- `src/lib/db/repository/user.ts` — add transactional/atomic account mutations, password changes, verification state, session-version invalidation, and identity lookup while keeping password hashes out of projections.
- `src/lib/auth/options.ts`, `src/lib/auth/authorize-credentials.ts`, `src/lib/auth/types.d.ts` — enforce verified status, add safe Google activation/linking rules, and carry a revocation/version claim without trusting stale role claims.
- `src/app/api/auth/register/route.ts` — change immediate activation into pending verification, send one-time verification mail, preserve generic anti-enumeration responses, and add resend handling.
- `src/proxy.ts`, `src/app/api/auth/account-access/route.ts`, `src/lib/auth/current-user.ts` — make status, email verification, and session-version checks fail closed across pages and APIs.
- `src/components/auth/register-form.tsx`, `src/components/auth/login-form.tsx`, `src/app/(auth)/register/page.tsx` — add accessible verification, recovery, reset, password-change, and conditionally enabled Google UX in the existing Spanish public experience.
- `src/lib/admin/users/role-change.ts`, `src/app/api/admin/usuarios/route.ts`, `src/components/admin/user-management.tsx` — prevent role/status administration from accidentally bypassing verification or destroying the last privileged recovery path.
- `scripts/admin-account-recovery.ts`, `scripts/reset-password.ts`, `scripts/create-productora.ts`, and new migration/runbook tooling — replace role-forcing assumptions with explicit, audited recovery operations that preserve the target role unless an authorized role change is separately requested.
- `tests/api-auth-register.test.ts`, `tests/user-repository.test.ts`, `tests/auth-options-authorize.test.ts`, `tests/auth-options-google.test.ts`, `tests/http/role-access.test.ts`, and new auth integration/security tests — preserve current role boundaries and add token, lifecycle, OAuth-linking, abuse, and session-revocation coverage.
- `.env.example` and deployment documentation — define SMTP/provider configuration, public URL, token expiry, rate-limit policy, and safe Google credential activation without storing secrets in Git.

### Approaches

1. **Extend the existing user document** — Add verification fields, optional provider metadata, password-reset fields, and lifecycle flags directly to `User`, then grow the repository and routes around that document.
   - Pros: lowest initial migration surface; reuses the current repository and account-access lookup; fewer collections and files.
   - Cons: mixes profile, credentials, external identities, and expiring secrets; makes one-time token cleanup and multi-provider linking harder to reason about; increases the chance that recovery code can affect roles or expose sensitive fields.
   - Effort: Medium

2. **Separate account, identity, and one-time-token concerns** — Keep role/status and durable account ownership on `User`; introduce an identity mapping for credentials/Google accounts and a hashed, purpose-scoped token store with expiry/consumption metadata. Put email delivery behind a small provider interface.
   - Pros: explicit account-linking invariants; raw tokens never persist; atomic one-time consumption and TTL cleanup are straightforward; password reset, verification, and future providers share safe primitives; role preservation is structurally separate from authentication method.
   - Cons: larger migration and repository surface; requires careful compatibility with current `passwordHash` records and NextAuth v4 callbacks; more integration tests are necessary.
   - Effort: High

### Recommendation

Use the separated account/identity/token design, delivered as a forced chained release. Treat verification as an account lifecycle prerequisite: new registrations start as `pending_email`, cannot sign in or reach protected content, and transition to `active` only after consuming a hashed, single-use, purpose-specific token. Verification and recovery responses remain generic, tokens expire quickly, are never logged, and are invalidated on use or security-version changes.

Keep roles and account status authoritative in MongoDB. Add a persisted security/session version and validate it at the same boundary that currently checks the account, so password change and reset revoke old JWTs. Google should be enabled only with complete credentials and explicit release configuration. A Google account with a provider-verified email may create a new `suscriptora` account, but it must never receive a privileged role. Matching an existing credentials account must require an authenticated local-link action or equivalent proof of control; do not silently merge by email. Existing provider identities must be unique by provider and provider account id, and linking must never overwrite role, status, or password.

Existing accounts need an explicit lifecycle migration, not an implicit trust upgrade. The migration should support dry-run/reporting, preserve every role, mark accounts whose email ownership is not proven as verification-required, and provide a controlled allowlist/runbook path for Admin and Olga. Staff recovery must set a new password and verified state only through an authenticated/operator-controlled flow while retaining the existing `admin` or `productora` role; it must revoke prior sessions. The current role-forcing scripts should be narrowed or replaced rather than reused as a public reset mechanism.

Use an SMTP-first `EmailSender` abstraction because SMTP is the project’s documented pending direction, with provider-neutral templates and configuration validation. Keep credentials and sender secrets outside the repository. Prefer Mongo-backed rate-limit/idempotency records or counters so abuse controls work across PM2 workers and restarts; apply separate limits to registration, verification resend, login, recovery requests, token consumption, and Google callbacks. Emit structured auth events without passwords, raw tokens, or unnecessary email addresses.

The review budget requires chained delivery rather than one feature branch slice. A viable sequence is:

1. **Foundation** — lifecycle/identity/token schemas, hashing/consumption primitives, SMTP interface/config validation, security version, structured event contract, and migration dry-run; no public UI.
2. **Verified registration** — pending accounts, verification/resend endpoints, email templates, abuse controls, and accessible registration/status UX.
3. **Recovery and password security** — generic forgot-password flow, expiring one-time reset, authenticated password change, session revocation, and staff recovery contract.
4. **Google OAuth and linking** — conditional provider activation, verified-email checks, explicit linking, new-account defaults, conflict UX, and role-preserving integration tests.
5. **Migration and hardening** — execute/verify the account migration against a safe snapshot or approved environment, complete observability dashboards/runbook, HTTP/browser coverage, and rollback evidence.

Each slice should have a clear start/finish and stay below the configured 800 authored changed-line budget; the implementation worktree must be created separately with its own CodeGraph index after planning approval.

### Risks

- Existing active accounts may be locked out or incorrectly trusted if migration semantics are not decided and rehearsed before activation.
- Email deliverability, SPF/DKIM/DMARC, sender identity, and SMTP failure behavior can make verification and recovery unusable even when application code is correct.
- Silent Google-to-password linking is an account-takeover risk; email equality alone is insufficient proof of control for an existing credentials account.
- JWT role and status claims can become stale unless every privileged boundary checks persisted account state and a revocable security version.
- Rate limits based only on process memory will not survive PM2 restarts or scale safely; proxy IP headers also require an explicit trusted-proxy policy.
- Recovery and migration tooling can accidentally force `admin` or `active`, changing privilege or bypassing verification; role preservation must be tested as an invariant.
- Generic anti-enumeration responses must be balanced with usable pending/suspended/recovery UX and accessible error announcements.
- Google OAuth remains intentionally unavailable in the current source; enabling it is a release/configuration decision, not a credentials-only change.

### Ready for Proposal

Yes. The foundational direction is clear enough for a proposal, but the proposal should explicitly state the migration policy for existing public accounts, the operator verification path for Admin/Olga, the initial SMTP provider/configuration contract, and the Google linking proof requirement. Do not create the implementation worktree or change application code until those scope decisions are approved.
