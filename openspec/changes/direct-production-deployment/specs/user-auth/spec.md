# Delta for User Authentication

## MODIFIED Requirements

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

The system MUST keep Google OAuth unavailable for this release, regardless of whether Google credentials are present. Email/password MUST remain the only supported sign-in method; enabling Google OAuth is deferred to a future application release.
(Previously: Google OAuth was available when production explicitly enabled it and provider credentials, callback settings, and validation passed.)

#### Scenario: Provider disabled
- GIVEN the application is running this release
- WHEN a visitor attempts Google sign-in
- THEN no Google authentication path is offered or accepted

#### Scenario: Credentials do not enable provider
- GIVEN valid Google OAuth credentials are present in production configuration
- WHEN the authentication providers are initialized
- THEN Google OAuth remains unavailable and email/password remains the only supported sign-in method

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
