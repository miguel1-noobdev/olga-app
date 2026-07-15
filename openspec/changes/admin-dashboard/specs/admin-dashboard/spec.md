# Admin Dashboard Specification

## Requirements

### Requirement: Private shell
Dashboard Admin MUST provide a shared shell. `/admin` MUST require technical role `admin`; its temporary article tool MUST remain until PR2.

#### Scenario: Authorized access
- GIVEN an authenticated `admin`
- WHEN `/admin` is requested
- THEN the shell and tool are available

#### Scenario: Denied access
- GIVEN a non-`admin` or anonymous user
- WHEN an `/admin` route is requested
- THEN protected content is unavailable

### Requirement: Safe readiness
Dashboard Admin MUST show bounded application, MongoDB, and authentication readiness. It MUST NOT disclose secrets, credentials, tokens, identities, raw errors, infrastructure details, or a raw MongoDB console.

#### Scenario: Ready dependencies
- GIVEN approved checks succeed
- WHEN Admin opens health
- THEN generic ready states are shown

#### Scenario: Failed dependency
- GIVEN a check fails or times out
- WHEN Admin opens health
- THEN a generic unavailable state is shown

### Requirement: PR1 boundary
PR1 MUST verify and roll back its boundary, tool, and safe states independently. It MUST NOT change public UI, Blog access, Stitch, migrations, or laboratory workflows.

#### Scenario: PR1 rollback
- GIVEN PR1 is reverted
- WHEN the prior release is restored
- THEN authorization and tooling remain intact

### Decision gates
Application-readiness scope and authentication signal MUST be approved before PR1.

### Requirement: Chained delivery
PR1–PR4 MUST be independently verifiable, rollbackable, chained changes of at most 800 lines. A successor MUST NOT start before predecessor verification.

#### Scenario: Oversized or premature slice
- GIVEN a slice exceeds 800 lines or lacks verification
- WHEN it is prepared
- THEN it is split or deferred
