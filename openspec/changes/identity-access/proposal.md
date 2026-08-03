# Proposal: Identity and Access

## Intent

Deliver verified accounts, revocable sessions, staff/password recovery, and optional Google sign-in. MongoDB roles authoritative; public registration never grants staff access.

## Scope

### In Scope
- Lifecycle, verification/resend, recovery/change-password, session revocation, and tokens.
- SMTP-first sending, delivery, abuse/audit, migration/runbooks, and safe Google linking.
- Role-preserving staff verification/recovery.

### Out of Scope
- Multi-tenant identity, commerce, MFA/passkeys, non-Google social providers, or dashboard redesign.
- Automatic trust upgrade, silent merging, or public reset flows for staff role changes.

## Capabilities

### New Capabilities
- `account-lifecycle-security`: lifecycle, tokens, delivery, migration, and security controls.

### Modified Capabilities
- `user-auth`: verified lifecycle, revocable sessions, safe Google linking, no first-user-admin rule.
- `blog-platform`: authenticated, active, verified access.

## Approach

Separate accounts, identities, and hashed tokens. Raw tokens exist only in URLs; they are purpose-bound, expiry-limited, atomic single-use, never logged, and invalidated by consumption or security-version change. Access fails closed on persisted status and session version.

New accounts remain `pending_email` until verified. Existing accounts receive no implicit upgrade: dry-run, preserve roles, then apply the approved verification/grace policy. An authenticated operator runbook recovers the targeted staff account, preserves `admin`/`productora`, revokes sessions, and never changes role/status incidentally.

`EmailSender` is SMTP-first and reads runtime-only secrets. Unit 2 temporarily uses Gmail SMTP sender `esenciales.ob@gmail.com` until a custom domain exists; absent or invalid SMTP configuration fails closed. Mailpit is test-only and never sends externally. Abuse controls allow 5 attempts per normalized email and 20 per trusted client IP per rolling hour; forwarded client IP is trusted only from local Nginx. Google stays disabled without explicit complete configuration; verified Google email creates only `suscriptora`; credentials accounts need authenticated explicit linking; identities are unique by provider/account ID.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/lib/db/{models,repository}` | Modified/New | Lifecycle, identity, tokens, migration |
| `src/lib/auth`, `src/proxy.ts`, auth APIs/UI | Modified | Enforcement and flows |
| `scripts/`, `.env.example`, tests | Modified/New | Runbooks and TDD evidence |

## Chained Scope

1. Foundation/dry-run; 2. verified registration; 3. recovery/revocation/staff operations; 4. Google/linking; 5. migration rehearsal, observability, hardening. Each slice stays ≤800 authored lines with receipt-driven review/rollback.

## Validation Required

- Public-account grace duration and staff-verification allowlist.
- Unit 2 SMTP runtime provisioning and local-Nginx forwarded-IP configuration before enablement; the approved sender, Mailpit isolation, fail-closed behavior, and 5/20 limits are fixed.
- Google release flag and proof for explicit local linking (Unit 4).

## Risks and Rollback

| Risk | Mitigation |
|---|---|
| Lockout/delivery failure | Dry-run, rehearsed migration, staged enforcement, restore prior lifecycle fields/config |
| Takeover/abuse | Generic responses, durable limits, no silent linking, audit events without secrets |

Disable new providers/routes, revert config/deployment, restore a pre-migration snapshot only through the approved runbook, and invalidate issued tokens/sessions; never roll back by changing roles.

## Success Criteria

- [ ] Unverified, suspended, stale, replayed, expired, and rate-limited flows fail closed without enumeration or secret leakage.
- [ ] Verification, recovery, staff preservation, Google conflicts, migration, rollback, and SMTP failures have automated receipt-backed evidence.
- [ ] No chain exceeds 800 lines; migration follows dry-run and operator sign-off.
