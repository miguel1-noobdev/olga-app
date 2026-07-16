# User Administration Specification

## Requirements

### Requirement: Minimal directory
Dashboard Admin MUST provide a protected directory with approved operational fields only. It MUST NOT disclose credentials, tokens, secrets, raw auth data, or unnecessary identities.

#### Scenario: Directory access
- GIVEN an authenticated `admin`
- WHEN the directory opens
- THEN only approved fields are shown

### Requirement: Confirmed changes
Only an `admin` MUST change a role or approved access status; each mutation MUST require confirmation. Cancellation or rejection MUST preserve records.

#### Scenario: Confirmed change
- GIVEN Admin selects an approved change
- WHEN Admin confirms it
- THEN only that user is changed

#### Scenario: Cancelled change
- GIVEN Admin starts a change
- WHEN confirmation is cancelled
- THEN no record changes

### Requirement: Minimal activity
Dashboard Admin MAY show approved minimal events. It MUST NOT provide surveillance, sensitive values, or raw errors.

#### Scenario: Activity access
- GIVEN an approved event exists
- WHEN Admin views activity
- THEN only its approved summary is shown

### Decision gates
Access-status and activity vocabularies, plus retention, MUST be approved before PR4.
