# Delta for User Authentication

## MODIFIED Requirements

Release context: This delta describes the existing application contract; it does not approve or perform production Google OAuth activation. Activation remains postponed, and enabling `GOOGLE_OAUTH_ENABLED` in production requires separate explicit project-owner release approval and passing evidence for every retained NO-GO gate. This release context is not a runtime approval mechanism.

### Requirement: Email and password registration

The system MUST allow a visitor to register with a unique email and a password of at least 8 characters. Every public registration MUST create a `suscriptora` account; privileged roles MUST NOT be selected through public registration.
(Previously: the first user could receive `admin` through the first-user-admin rule.)

#### Scenario: Successful registration
- GIVEN the user provides an unused email and a valid password
- WHEN the registration form is submitted
- THEN a user record is created with role `suscriptora`
- AND the user is signed in and redirected to `/blog`

#### Scenario: Duplicate email
- GIVEN the email is already registered
- WHEN the registration form is submitted
- THEN the request fails with a generic message and no account is created

#### Scenario: Weak password rejected
- GIVEN a password shorter than 8 characters
- WHEN registration is attempted
- THEN the form is rejected before any user record is created

### Requirement: Google OAuth sign-in

The system MUST offer Google sign-in only when `GOOGLE_OAUTH_ENABLED` is exactly `true` and both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are nonblank after trimming; otherwise Google sign-in MUST remain unavailable. Email/password sign-in MUST remain available. The system MUST accept only verified Google identities. A newly accepted Google identity MUST create an account with role `suscriptora` only. An already-linked Google identity MUST sign in to the same account without changing its role. The system MUST NOT automatically link or merge identities by email. If a verified Google identity's email matches an existing credentials account but that Google identity is not linked, the system MUST deny sign-in through `/login?error=AccountInUse` without creating or linking an identity or changing the account or its role. The same login form MUST offer manual password sign-in; it MUST NOT automatically switch providers or prefill credentials. Explicit account linking MUST remain unavailable and out of scope for this release.
(Previously: Google OAuth was unavailable for this release regardless of whether credentials were present.)

#### Scenario: Provider enabled with complete configuration
- GIVEN `GOOGLE_OAUTH_ENABLED` is exactly `true` and both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are nonblank after trimming
- WHEN the authentication providers are initialized
- THEN Google sign-in is offered and email/password sign-in remains available

#### Scenario: Provider disabled or configuration incomplete
- GIVEN `GOOGLE_OAUTH_ENABLED` is not exactly `true`, or either credential is missing or blank after trimming
- WHEN the authentication providers are initialized
- THEN Google sign-in is unavailable and email/password sign-in remains available

#### Scenario: New verified Google identity
- GIVEN Google sign-in is enabled and a verified Google identity is not already linked and its email is not registered
- WHEN the identity signs in
- THEN a new account is created with role `suscriptora`

#### Scenario: Already-linked Google identity
- GIVEN Google sign-in is enabled and the verified Google identity is already linked to an account
- WHEN the identity signs in
- THEN the same account is authenticated and its role is unchanged

#### Scenario: Google email matches an unlinked credentials account
- GIVEN Google sign-in is enabled and a verified Google identity's email matches an existing credentials account without an existing link
- WHEN the identity attempts to sign in
- THEN sign-in is denied through `/login?error=AccountInUse`
- AND no Google identity is created or linked
- AND the existing account and its role are unchanged
- AND the same login form offers manual password sign-in
- AND no provider switch or credential prefill occurs automatically

#### Scenario: Unverified Google identity
- GIVEN Google sign-in is enabled but the Google identity is not verified
- WHEN the identity attempts to sign in
- THEN sign-in is denied and no account or identity is created

### Requirement: First-user-admin rule

The system MUST NOT assign `admin` automatically based on collection state. The `admin` and `productora` roles MUST be assigned only through an authorized privileged provisioning process.
(Previously: the first user ever created became `admin` regardless of registration method.)

#### Scenario: First public user
- GIVEN the user collection is empty
- WHEN the first user registers
- THEN the created user MUST have role `suscriptora`

#### Scenario: Privileged provisioning
- GIVEN an authorized operator invokes the provisioning process
- WHEN a valid target account is created or promoted
- THEN the requested privileged role is persisted and the action is auditable

## ADDED Requirements

### Requirement: Fail-closed production role enforcement

Production MUST deny privileged access when a session has a missing, unknown, inactive, or unauthorized role; it MUST NOT treat malformed role data as a public or privileged role.

#### Scenario: Valid role boundary
- GIVEN an active authenticated user has a recognized role
- WHEN the user requests a protected area
- THEN access is granted only when that role is authorized for the area

#### Scenario: Invalid role boundary
- GIVEN a session has an unknown role or the account is inactive
- WHEN the user requests `/laboratorio` or `/admin`
- THEN access is denied and no privileged action is performed
