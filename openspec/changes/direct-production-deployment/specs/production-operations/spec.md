# Production Operations Specification

## Purpose

Define verifiable production operation for the direct deployment of Botánica Esencial OB, including access boundaries, service health, data recovery, releases, rollback, and evidence.

## Requirements

### Requirement: Protected production runtime

Production MUST serve only the validated application over HTTPS, keep database access private and authenticated, and expose no diagnostic secrets or privileged interfaces publicly.

#### Scenario: Public runtime boundary
- GIVEN production is deployed
- WHEN an anonymous client requests the public site and database ports
- THEN HTTPS serves the application and database access is refused from the public network

#### Scenario: Invalid runtime configuration
- GIVEN a required production secret or authenticated database setting is absent
- WHEN a release preflight runs
- THEN the release is rejected and the current release remains serving

### Requirement: Operational health contract

The system MUST provide unauthenticated liveness and readiness behavior that does not disclose credentials, user data, or internal diagnostics; detailed diagnostics MUST remain privileged.

#### Scenario: Healthy probe
- GIVEN the application and required database dependency are available
- WHEN an operational probe is requested
- THEN it returns a successful health result without sensitive details

#### Scenario: Unready dependency
- GIVEN the application cannot reach its required database
- WHEN readiness is requested
- THEN it reports failure, while the privileged diagnostic report remains restricted

### Requirement: Database protection and recovery

Production data MUST use authenticated persistent storage, remain reachable only from the application host, and have a restorable backup with recorded evidence.

#### Scenario: Backup restore test
- GIVEN a completed production backup exists
- WHEN an authorized recovery test restores it into an isolated target
- THEN expected users, content, and laboratory records are verifiably recoverable

#### Scenario: Failed backup or restore
- GIVEN a scheduled backup or restore validation fails
- WHEN the failure is detected
- THEN the release gate is NO-GO and the failure is recorded for remediation

### Requirement: Gated release and rollback

Each release MUST use an immutable validated version and pass build, configuration, DNS/TLS, health, backup/restore, role-smoke, and release-identity gates before activation. The committed SHA, immutable release directory SHA, activation script SHA, and `current` symlink target MUST be the same full SHA. Any mismatch or preflight failure MUST stop the handoff before `current` or PM2 changes. Rollback MUST restore the prior verified compatible version without crossing an unapproved data change.

#### Scenario: Release passes all gates
- GIVEN all required evidence is current and passing
- WHEN the release is activated
- THEN the validated version serves through HTTPS
- AND the committed SHA, release SHA, activation-script SHA, and `current` target are recorded as the same value

#### Scenario: Release identity mismatch
- GIVEN any of the committed SHA, immutable release SHA, activation script SHA, or `current` target differs
- WHEN the release preflight runs
- THEN activation is rejected before any symlink or PM2 change
- AND the mismatch is recorded without secrets

#### Scenario: Release or rollback failure
- GIVEN a gate fails or the new version is unhealthy
- WHEN release recovery is initiated
- THEN the prior verified compatible version is restored, traffic is revalidated, and the failure is recorded

### Requirement: Production evidence

The deployment record MUST include passing, timestamped, release-aligned, non-secret evidence for anonymous access, subscriber access, productora access, admin access, privileged provisioning, denial cases, health, database recovery, ACME test diagnosis, release, and rollback. Temporary protected credentials MUST be cleaned up with non-secret evidence of removal.

#### Scenario: Complete evidence set
- GIVEN a release candidate is being approved
- WHEN the evidence record is reviewed
- THEN every listed flow has a reproducible result and the release decision is explicit

#### Scenario: Missing role evidence
- GIVEN any role smoke check or provisioning check is missing or failing
- WHEN approval is requested
- THEN production remains NO-GO

#### Scenario: Incomplete operational evidence
- GIVEN ACME test diagnosis, release-aligned logs, or credential-cleanup evidence is missing
- WHEN a runtime action is proposed
- THEN the action is prohibited until the missing evidence is reconciled

### Requirement: POSIX-compatible release handoff

The remote release handoff wrapper MUST be POSIX-compatible. It MUST not run Bash syntax through `sh`, invoke `runuser` from a non-root SSH session, or mask a failed preflight command. It MUST verify remote identity and release-path ownership before transfer; the root-only activation script is the only stage that may switch to the PM2 account.

#### Scenario: Non-root handoff preflight
- GIVEN the SSH session is non-root
- WHEN release ownership and identity are checked
- THEN the wrapper records the SSH identity and path owner/group/mode
- AND it does not invoke `runuser`
- AND a failed check stops the handoff

### Requirement: Receipt-only managed-release preflight

Receipt-only mode MUST accept only an approved non-secret endpoint selector and owner/group/mode comparison policy. It MUST make exactly one non-mutating remote query to derive the active managed release and effective root, validate the canonical immutable release relationship and policy, and emit a sanitized receipt with `release`, `execution_class`, `connection_count`, `identity`, `metadata`, `effective_root`, `transfer`, `preparation`, and `activation`. `execution_class=remote_command_failure` MUST identify a nonzero SSH exit, `execution_class=invalid_remote_output` MUST identify a successful SSH exit with invalid managed-release output, and `execution_class=success` MUST identify valid remote execution and output. It MUST not archive, transfer, prepare, activate, manage services, retry, infer unobserved G.1/G.2 evidence, or classify an external caller-side capture failure. Missing selector or policy MUST fail locally; malformed, ambiguous, or mismatched query output MUST fail closed after at most one query.

#### Scenario: Receipt-only preflight establishes bounded evidence
- GIVEN an approved selector and complete comparison policy
- WHEN receipt-only preflight runs
- THEN one remote query derives the active release and effective root
- AND the receipt reports `connection_count=1`, the applicable `execution_class`, identity and metadata outcomes, and `transfer=absent`, `preparation=absent`, and `activation=absent`
- AND reviewed commit, activation-script SHA, `current` target, and runtime health remain explicitly unverified unless separately evidenced
