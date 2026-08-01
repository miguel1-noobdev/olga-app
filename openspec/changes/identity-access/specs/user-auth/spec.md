# Delta for User Authentication

## MODIFIED Requirements

### Requirement: Email and password registration

The system MUST create unique email/password accounts as `suscriptora` with `pending_email` status and MUST NOT sign them in before verification. Password policy is a configuration decision.
(Previously: registration immediately signed in a new `suscriptora`.)

#### Scenario: Successful registration
- GIVEN an unused email and valid password
- WHEN registration is submitted
- THEN a pending `suscriptora` account is created and delivery is attempted

#### Scenario: Duplicate or weak input
- GIVEN a registered email or invalid password
- WHEN registration is attempted
- THEN a generic failure is returned and no privileged account is created

#### Scenario: Verification is required
- GIVEN a new registration is persisted
- WHEN registration completes
- THEN no session is created until email verification succeeds

### Requirement: Google OAuth sign-in

Google OAuth MUST remain disabled without explicit complete configuration. Verified Google email MAY create only `suscriptora`; credential accounts require authenticated explicit linking; identities MUST be unique by provider/account ID.
(Previously: Google could create or link by email without explicit linking rules.)

#### Scenario: Safe Google sign-in
- GIVEN Google is enabled and returns a verified email
- WHEN a new OAuth callback completes
- THEN a `suscriptora` account is created and signed in

#### Scenario: Existing identity signs in
- GIVEN a Google identity is already linked
- WHEN its callback completes
- THEN the linked account signs in without role change

#### Scenario: Ambiguous email conflict
- GIVEN a credential account exists for the Google email
- WHEN OAuth runs without authenticated linking
- THEN sign-in is denied without merging or enumeration

### Requirement: Role model

The system MUST store one authoritative role per user from `suscriptora`, `productora`, or `admin`; authentication MUST preserve persisted roles.
(Previously: role assignment could be affected by first-user creation.)

#### Scenario: Role remains authoritative
- GIVEN a `productora` or `admin` authenticates
- WHEN session data is created
- THEN it reflects the persisted role

#### Scenario: Default role assignment
- GIVEN a new public registration succeeds
- WHEN its record is persisted
- THEN its role is `suscriptora`

### Requirement: First-user-admin rule

The system MUST NOT assign `admin` by registration order. Staff roles MUST be provisioned or changed only by authorized operators.
(Previously: the first user became `admin`.)

#### Scenario: First public registration
- GIVEN the user collection is empty
- WHEN a visitor registers
- THEN the role is `suscriptora`, never `admin`

#### Scenario: Subsequent public registration
- GIVEN at least one user exists
- WHEN another visitor registers
- THEN the new role is `suscriptora`

### Requirement: Login with email and password

The system MUST authenticate only accounts with valid credentials, permitted status, required verification, and current session/security version.
(Previously: any registered account with valid credentials could authenticate.)

#### Scenario: Unverified new account
- GIVEN a new account is pending email
- WHEN correct credentials are submitted
- THEN authentication fails generically and no session is created

#### Scenario: Valid permitted login
- GIVEN an active account has verified credentials
- WHEN correct credentials are submitted
- THEN a session is created and the requested page or `/blog` opens

#### Scenario: Invalid login
- GIVEN incorrect credentials are submitted
- WHEN login is attempted
- THEN authentication fails with a generic error

### Requirement: Session contents

The session MUST include user id, email, role, and revocation-detection version; authorization MUST re-check persisted status and role.
(Previously: session contained id, email, and role only.)

#### Scenario: Revocation detected
- GIVEN the persisted session/security version advanced
- WHEN the session is resolved
- THEN the session and protected access are rejected

### Requirement: Protected route behavior

The system MUST require an authenticated, active, policy-compliant session for `/blog` and articles, preserving return URLs without account-state leakage.
(Previously: routes required authentication only.)

#### Scenario: Anonymous or inactive access
- GIVEN a visitor or inactive user requests `/blog`
- WHEN processing occurs
- THEN access is denied or redirected generically

#### Scenario: Return URL preserved
- GIVEN an anonymous visitor requests `/blog/articulo-1`
- WHEN login is required
- THEN that return URL is preserved without account-state disclosure

## ADDED Requirements

### Requirement: Explicit password and staff recovery

The system MUST provide authenticated change and generic reset flows. An authorized operator MAY recover a targeted `productora` or `admin`, MUST preserve its role, MUST revoke sessions, and MUST NOT incidentally change status.

#### Scenario: Staff recovery preserves authority
- GIVEN an authorized operator targets a staff account
- WHEN recovery completes
- THEN credentials change, sessions revoke, and the role remains unchanged

### Requirement: Administrative identity behavior

Admin operations MUST require explicit authorization and audit sensitive actions. Public registration, reset, linking, or migration MUST NOT grant or change staff roles.

#### Scenario: Unauthorized role attempt
- GIVEN a non-admin requests a role-changing operation
- WHEN authorization is evaluated
- THEN it is denied and audited without mutation
