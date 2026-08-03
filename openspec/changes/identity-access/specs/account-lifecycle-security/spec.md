# Account Lifecycle Security Specification

## Purpose

Define secure account states, email ownership, recovery, session invalidation, delivery, auditability, migration, and rollback for the single-tenant platform.

## Requirements

### Requirement: Account lifecycle and role safety

The system MUST persist lifecycle status separately from role. Public registration MUST create only `suscriptora` accounts in `pending_email`; it MUST NOT grant staff roles.

#### Scenario: Verified registration becomes usable
- GIVEN a new account is pending email verification
- WHEN a valid verification token is consumed
- THEN the account becomes active and may authenticate

#### Scenario: Suspended account fails closed
- GIVEN an account is suspended or stale under configured policy
- WHEN it attempts authentication or protected access
- THEN access is denied without changing its role

### Requirement: Verification and resend

The system MUST provide purpose-bound, expiring verification and resend flows with generic responses and provider-sensitive expiry/cooldown values defined as configuration decisions.

#### Scenario: Resend rotates pending proof
- GIVEN a pending account requests another verification email after its cooldown
- WHEN the request succeeds
- THEN a new token is issued and prior pending verification tokens are unusable

#### Scenario: Unknown address is not disclosed
- GIVEN a verification or resend request names an unknown address
- WHEN it is processed
- THEN the response is indistinguishable from a known-address response

### Requirement: Email delivery failure is fail-closed

SMTP sender and readiness configuration MUST be validated before sending. Temporary production delivery MUST use Gmail SMTP with the dedicated sender `esenciales.ob@gmail.com`. Its app password MUST remain a VPS/runtime secret and MUST NOT appear in source, examples, test fixtures, or artifacts. Automated tests MUST use Mailpit and MUST NOT deliver external email. SMTP MUST fail closed when its approved runtime configuration is absent or invalid. Delivery failure MUST NOT activate an account or expose a raw provider error.
(Previously: provider, domain, and SPF/DKIM/DMARC readiness remained undecided configuration.)

#### Scenario: Approved production SMTP is used
- GIVEN approved runtime SMTP configuration is present and valid
- WHEN a production verification or recovery message is sent
- THEN Gmail SMTP sends it using `esenciales.ob@gmail.com`
- AND no credential value is written to source, examples, fixtures, or artifacts

#### Scenario: Automated email remains local
- GIVEN automated tests exercise an email flow
- WHEN a message is sent
- THEN Mailpit receives it
- AND no external email provider is contacted

#### Scenario: Missing or invalid SMTP fails closed
- GIVEN approved runtime SMTP configuration is absent or invalid
- WHEN an email flow attempts delivery
- THEN no message is sent, the account cannot authenticate as verified, and the response is generic

### Requirement: Token security

Raw tokens MUST exist only in user-facing URLs, MUST be hashed at rest, purpose-bound, expiry-limited, atomic single-use, never logged, and invalidated by consumption or security-version change.

#### Scenario: Replay is rejected
- GIVEN a verification or recovery token was consumed, expired, or invalidated
- WHEN it is presented again
- THEN the operation fails without revealing token state

### Requirement: Recovery and password change

The system MUST support generic password recovery, authenticated password change, and reset-token rotation. Password reset MUST preserve the persisted role and lifecycle policy.

#### Scenario: Recovery succeeds
- GIVEN a user owns a valid reset token and supplies a valid password
- WHEN the reset is submitted
- THEN the password changes, reset tokens are invalidated, and existing sessions are revoked

### Requirement: Session revocation

The system MUST enforce persisted status and a session/security version so users and authorized operators can revoke all sessions without changing roles.

#### Scenario: Revoked session fails
- GIVEN a session predates revocation
- WHEN it requests protected content
- THEN access is denied and no replacement session is issued

### Requirement: Abuse limits and audit

Verification, resend, login, recovery, reset, and OAuth/linking endpoints MUST use durable rate limits of 5 attempts per normalized email per rolling hour and 20 attempts per trusted client IP per rolling hour. The app MAY trust forwarded client-IP headers only from the local Nginx reverse proxy; direct or untrusted forwarded headers MUST NOT determine the limit key. Security events MUST be auditable without secrets or raw tokens.
(Previously: thresholds and proxy trust remained undecided configuration.)

#### Scenario: Limit reached
- GIVEN a normalized email has reached 5 attempts or a trusted client IP has reached 20 attempts in the rolling hour
- WHEN another sensitive request arrives
- THEN it is rejected generically and an audit event records the outcome

#### Scenario: Only the local proxy supplies the client IP key
- GIVEN a request arrives through the local Nginx reverse proxy with a forwarded client IP
- WHEN the IP-based limit key is calculated
- THEN the forwarded client IP determines the key

#### Scenario: Untrusted forwarding cannot evade limits
- GIVEN a request arrives directly or through an untrusted proxy with a forwarded client IP
- WHEN the IP-based limit key is calculated
- THEN the forwarded value is ignored and MUST NOT determine the key

### Requirement: Migration and rollback

Migration MUST support dry-run, receipt-backed review, approved enforcement, and role preservation. Existing accounts remain active; verification is required only for new registrations. Rollback MUST disable new routes/providers, restore approved lifecycle/configuration state, invalidate tokens/sessions, and MUST NOT change roles.

#### Scenario: Dry-run finds legacy accounts
- GIVEN existing accounts lack lifecycle fields
- WHEN migration dry-run runs
- THEN it reports proposed changes without mutating accounts or roles

#### Scenario: Approved rollback
- GIVEN the release causes lockout or delivery failure
- WHEN the approved rollback runbook runs
- THEN new identity features are disabled, sessions/tokens are invalidated, and roles remain unchanged
