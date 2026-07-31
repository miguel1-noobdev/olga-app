# Design: Identity and Access

## Technical Approach

Extend the existing NextAuth v4 credentials flow, but make MongoDB authoritative for lifecycle, role, status, and security version. Separate accounts, provider identities, and one-time tokens. New accounts are `pending_email`; verification is required only for new registrations, while existing accounts remain active. Protected boundaries revalidate persisted state and session version.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Identity model | Keep `User` as account authority; add `Identity` for credentials/Google and `AuthToken` for hashed purpose-bound tokens. | Put providers and reset fields on `User`. | Unique provider keys, atomic consumption, and role preservation stay explicit. |
| Existing-account policy | Preserve existing accounts as active; enforce email verification only for new registrations. | Retroactively require verification or introduce a grace window. | This is the approved policy and avoids locking out current users while securing future registrations. |
| Session revocation | Persist `securityVersion`; copy it into JWT and compare during account lookup. Increment on password/security changes. | JWT-only expiry or deleting cookies. | Revokes all old sessions across browsers and PM2 restarts. |
| Email | `EmailSender` interface with SMTP implementation and validated config; templates contain no secrets. | Provider SDK directly in routes. | Keeps delivery testable and SMTP-first as documented. |
| Google | Enable only with complete config and release flag; verified Google email may create `suscriptora`; existing local accounts require authenticated explicit linking. | Silent email-based merge or privileged provisioning. | Email equality is not proof of local-account control; public registration never grants staff access. |

## Data Flow

```text
Route/UI -> application service -> repository -> MongoDB
                         |              |
                    EmailSender   audit/rate-limit records
```

Registration creates a pending account and credential identity, hashes a verification token with SHA-256, stores expiry/purpose, and sends the raw token only in the URL. Verification atomically matches hash/purpose/account, requires unconsumed and unexpired state, activates the account, and consumes the token. Recovery reuses the primitive; password change/reset increments `securityVersion` and consumes relevant tokens.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/db/models/user.ts`, `repository/user.ts` | Modify | Lifecycle, verification, security version, atomic mutations; preserve roles and active accounts. |
| `src/lib/db/models/identity.ts`, `auth-token.ts`, `rate-limit.ts`, `auth-event.ts` | Create | Provider uniqueness, hashed one-time tokens/TTL, durable limits, redacted audit events. |
| `src/lib/auth/{options,authorize-credentials,current-user,types}.ts` | Modify | Verified authorization, persisted version checks, conditional Google/linking contracts. |
| `src/lib/email/{sender,config,templates}.ts` | Create | SMTP boundary, readiness validation, verification/recovery messages. |
| `src/app/api/auth/{register,verify,resend,forgot-password,reset-password,change-password,link-google}/route.ts` | Modify/Create | Generic responses, auth flows, session checks, rate limits. |
| `src/proxy.ts`, `src/app/api/auth/account-access/route.ts` | Modify | Fail-closed status, verification, and version enforcement. |
| `src/components/auth/*`, auth pages | Modify | Accessible pending, recovery, reset, change-password, and gated Google UX. |
| `scripts/identity-migration.ts`, `scripts/staff-account-recovery.ts`, `.env.example` | Create/Modify | Dry-run/apply migration, role-preserving operator recovery, external config contract. |
| `tests/**` | Create/Modify | RED-first unit, Mongo integration, HTTP, and browser-facing contracts. |

## Interfaces / Contracts

```ts
type TokenPurpose = 'email_verification' | 'password_reset' | 'google_link';
interface AuthToken { accountId: string; purpose: TokenPurpose; tokenHash: string; expiresAt: Date; consumedAt?: Date; }
interface EmailSender { send(message: { to: string; template: 'verify'|'recover'; tokenUrl: string }): Promise<void>; }
interface AccountAccess { role: Role; accountStatus: AccountStatus; emailVerified: boolean; securityVersion: number; }
```

Raw tokens use a cryptographically secure source, are never logged or persisted, are hashed before storage, and are consumed with one conditional update (`consumedAt: null`, matching hash/purpose/account/expiry). Durable limits are keyed by normalized email and trusted client IP; invalid proxy configuration fails closed for sensitive operations.

## Testing Strategy

Unit tests cover token replay/expiry, limits, sender readiness, role-preserving recovery, and JWT version claims. Mongo tests cover migration, uniqueness, password changes, and concurrent consumption. HTTP tests cover generic responses, lifecycle flows, stale sessions, signed account access, Google conflicts/linking, and SMTP failures. Existing role/proxy tests remain gates. Tests follow the repository's strict TDD configuration.

## Threat Matrix

| Boundary | Applicability / response / RED test |
|---|---|
| Documentation-like paths | N/A — this change does not classify documentation or executable files. |
| Git repository selection | N/A — the product design does not select repositories or invoke Git commands. |
| Commit state | N/A — commit/index behavior is outside the product and test scope. |
| Push state | N/A — remote publication is outside the product and test scope. |
| PR commands | N/A — pull-request automation and command composition are not part of this change. |

## Migration / Rollout

Run a read-only migration report first. Apply after sign-off: preserve every role; existing accounts stay active, while new registrations require verification. Implement in ordered slices: foundation/dry-run; verified registration; recovery/revocation/staff; Google/linking; migration/hardening. Rollback disables new routes/providers, restores config/lifecycle fields through the runbook, and invalidates tokens/sessions; never changes roles.

## Open Questions

- [ ] Confirm SMTP provider/domain readiness and trusted-proxy/rate-limit thresholds.
- [ ] Approve Google release flag and explicit local-link proof UX.
