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

SMTP sender, domain, and readiness configuration MUST be validated before sending. Delivery failure MUST NOT activate an account or expose a raw provider error; provider/domain/SPF/DKIM/DMARC decisions remain configuration decisions.

#### Scenario: Registration email cannot be delivered
- GIVEN account persistence or delivery fails during registration
- WHEN the flow completes
- THEN the account cannot authenticate as verified and the response is generic

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

Verification, resend, login, recovery, reset, and OAuth/linking endpoints MUST use durable, trusted-proxy-aware rate limits; thresholds and proxy trust MUST be configuration decisions. Security events MUST be auditable without secrets or raw tokens.

#### Scenario: Limit reached
- GIVEN an identity or network exceeds a configured limit
- WHEN another sensitive request arrives
- THEN it is rejected generically and an audit event records the outcome

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
