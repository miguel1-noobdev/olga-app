# Delta for Blog Platform

## MODIFIED Requirements

### Requirement: Registered-only access

The blog MUST be accessible only to authenticated users whose account is active and satisfies the verification policy. Existing accounts remain eligible without an implicit verification upgrade.
(Previously: any authenticated user could access the blog.)

#### Scenario: Anonymous or unverified new user blocked
- GIVEN an anonymous user or a pending new registration requests `/blog`
- WHEN access is processed
- THEN the user is redirected to login or verification guidance with a return URL

#### Scenario: Existing active account granted access
- GIVEN an existing account remains active under migration policy
- WHEN it requests `/blog`
- THEN the blog listing is rendered

#### Scenario: Policy-compliant authenticated user granted access
- GIVEN an authenticated user is active and satisfies verification policy
- WHEN it requests `/blog`
- THEN the blog listing page is rendered

### Requirement: Article view

The system MUST render article pages only after the same active, authenticated, and verification-policy checks as the listing.
(Previously: article pages required authentication only.)

#### Scenario: Inactive article access
- GIVEN a suspended or revoked user opens `/blog/{slug}`
- WHEN authorization runs
- THEN article content is not rendered

#### Scenario: Open article
- GIVEN an authenticated, active, policy-compliant user navigates to `/blog/{slug}`
- WHEN the page loads
- THEN the article title, image, content, author, date, category, and tags are displayed
