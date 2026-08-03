# Design: Identity and Access

## Approach

Extend the existing NextAuth v4 credentials flow while keeping MongoDB authoritative for lifecycle, role, status, and security version. Separate accounts, identities, and hashed tokens. New accounts are `pending_email`; verification applies only to new registrations. Boundaries revalidate persisted state and session version.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Identity model | Keep `User` authoritative; add `Identity` and `AuthToken`. | Fields on `User`. | Explicit provider uniqueness, atomic consumption, and role preservation. |
| Existing accounts | Preserve accounts as active; verify new registrations. | Retroactive verification. | Avoids lockout under the approved policy. |
| Session revocation | Persist `securityVersion`, copy it into JWT, and compare during lookup. | JWT expiry. | Revokes sessions across browsers and PM2 restarts. |
| Email transport | `EmailSender` uses validated runtime-only SMTP configuration. Gmail SMTP through `esenciales.ob@gmail.com` is approved temporarily until a custom domain exists; only the address is documented, never app-password values. Mailpit is test-only and captures mail without external delivery. | Provider SDK in routes or credentials in source/examples. | Testability, no secret leakage, and future transport replacement without changing registration contracts. |
| Abuse controls | Durable rolling-hour limits: 5 per normalized email and 20 per trusted client IP. Forwarded IP headers are trusted only from local Nginx. | Arbitrary forwarded headers or process-local counters. | Prevents spoofing and survives PM2 restarts. |
| Google | Enable only with complete config and release flag; verified Google email creates only `suscriptora`; local accounts require authenticated explicit linking. | Silent merge or privileged provisioning. | Email equality does not prove local-account control. |

## Data Flow

```text
Route/UI -> application service -> repository -> MongoDB
                         |              |
                    EmailSender   audit/rate-limit records
```

Registration creates a pending account and identity, hashes a token, stores purpose/expiry, and sends the raw token only in the URL. Verification atomically matches hash/purpose/account/expiry, activates the account, and consumes the token. Recovery reuses the primitive; security changes increment `securityVersion`.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/db/models/user.ts`, `src/lib/db/repository/user.ts` | Modify | Lifecycle, verification, version, and role-preserving mutations. |
| `src/lib/db/models/{identity,auth-token,rate-limit,auth-event}.ts` | Create | Provider uniqueness, hashed tokens, durable limits, redacted audit. |
| `src/lib/auth/{options,authorize-credentials,current-user,types}.ts` | Modify | Verification, version checks, and linking contracts. |
| `src/lib/email/{sender,config,templates}.ts` | Create | Runtime-only validated SMTP, temporary Gmail sender, Mailpit adapter, and templates; no app-password values. |
| `src/app/api/auth/{register,verify,resend,forgot-password,reset-password,change-password,link-google,account-access}/route.ts` | Modify/Create | Generic lifecycle responses, delivery, session checks, and limits. |
| `src/lib/auth/client-ip.ts`, `src/proxy.ts`, `ops/nginx/botanicasob.conf` | Modify/Create | Local-Nginx trusted forwarded-IP contract and fail-closed enforcement. |
| `src/components/auth/*`, auth pages, `.env.example`, `scripts/*` | Modify | Pending/recovery UX, external runtime names, migration and recovery runbooks. |
| `tests/**` | Create/Modify | RED-first unit, Mongo, HTTP, Mailpit, proxy, and browser contracts. |

## Interfaces / Contracts

```ts
type TokenPurpose = 'email_verification' | 'password_reset' | 'google_link';
interface EmailSender {
  send(message: { to: string; template: 'verify' | 'recover'; tokenUrl: string }): Promise<void>;
}
interface AccountAccess { role: Role; accountStatus: AccountStatus; emailVerified: boolean; securityVersion: number; }
```

Sender configuration is read only from runtime environment, validated before use, and fails closed when absent or invalid. The Gmail app-password value never appears in source, examples, fixtures, logs, or artifacts. Limits use normalized email and trusted client IP; direct or untrusted forwarded headers cannot choose the IP key.

## Testing Strategy

Unit tests cover token replay/expiry, exact 5/20 boundaries, normalization, forwarded-IP trust, sender validation, no-send behavior, and JWT claims. Mailpit integration asserts capture without external delivery and checks the documented sender address without credential values. Mongo tests cover uniqueness and concurrent consumption; HTTP tests cover pending registration, generic responses, rotation, no session before verification, and SMTP failures. Existing role/proxy and Nginx topology tests remain gates. Follow strict TDD.

## Threat Matrix

| Boundary | Applicability / response / RED test |
|---|---|
| Documentation-like paths | N/A — no documentation or executable classification. |
| Git repository selection | N/A — no repository selection or Git commands. |
| Commit state | N/A — commit/index behavior is outside product scope. |
| Push state | N/A — remote publication is outside product scope. |
| PR commands | N/A — PR automation is not part of this change. |

## Migration / Rollout

Run a read-only migration report, then apply after sign-off while preserving roles and active accounts. Unit 2 uses Gmail SMTP and Mailpit in tests. When a custom domain arrives, change SMTP implementation/configuration and readiness checks without changing registration, verification, resend, or `EmailSender` contracts. Rollback disables new routes/providers, restores configuration, and invalidates tokens/sessions without changing roles.

## Open Questions

- [ ] Confirm VPS runtime SMTP secret provisioning and local-Nginx forwarded-IP configuration before enabling Unit 2.
- [ ] Approve Google release flag and explicit local-link proof UX.
