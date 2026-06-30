# User Authentication Specification

## Purpose

Define role-based authentication for Botánica Esencial OB using NextAuth.js with email/password and Google OAuth.

## Requirements

### Requirement: Email and password registration

The system MUST allow a visitor to register with a unique email and a password of at least 8 characters.

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

The system MUST support Google OAuth as a sign-up and sign-in method.

#### Scenario: New Google user

- GIVEN a visitor authenticates with Google for the first time
- WHEN the OAuth callback completes
- THEN a user record is created or linked using the Google email
- AND the user is signed in

### Requirement: Role model

The system MUST store one role per user from the set `suscriptora`, `productora`, `admin`.

#### Scenario: Default role assignment

- GIVEN a new registration succeeds
- WHEN the user record is persisted
- THEN the role MUST be `suscriptora` unless the first-user-admin rule applies

### Requirement: First-user-admin rule

The system MUST assign the `admin` role to the first user ever created, regardless of registration method.

#### Scenario: First registered user becomes admin

- GIVEN the user collection is empty
- WHEN the first user registers with email/password or Google
- THEN the created user MUST have role `admin`

#### Scenario: Subsequent users remain suscriptoras

- GIVEN at least one user already exists
- WHEN another user registers
- THEN the new user MUST have role `suscriptora`

### Requirement: Login with email and password

The system MUST authenticate a user when valid credentials are provided.

#### Scenario: Valid login

- GIVEN a registered user submits the correct email and password
- WHEN the login form is submitted
- THEN a session is created and the user is redirected to `/blog`

#### Scenario: Invalid login

- GIVEN incorrect credentials are submitted
- WHEN the login form is submitted
- THEN authentication fails with a generic error message

### Requirement: Session contents

The system MUST include the user's id, email, and role in the session.

#### Scenario: Protected route reads role

- GIVEN an authenticated user requests a protected page
- WHEN the session is resolved
- THEN the application MUST be able to read the user's role from the session

### Requirement: Logout

The system MUST allow an authenticated user to sign out.

#### Scenario: Successful logout

- GIVEN an authenticated user clicks logout
- WHEN the logout action completes
- THEN the session is invalidated
- AND the user is redirected to the landing page

### Requirement: Protected route behavior

The system MUST require authentication for `/blog` and any article page under it.

#### Scenario: Anonymous access to blog

- GIVEN an unauthenticated user requests `/blog`
- WHEN the request is processed
- THEN the user is redirected to `/login` with a return URL pointing to `/blog`

### Requirement: Role-based redirect after login

The system MUST redirect a freshly authenticated user to the originally requested protected page, or to `/blog` if none was requested.

#### Scenario: Login from restricted link

- GIVEN an anonymous user clicked a link to `/blog/articulo-1`
- WHEN the user completes login
- THEN the user is redirected to `/blog/articulo-1`
