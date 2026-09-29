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

Each release MUST use an immutable validated version and pass build, configuration, DNS/TLS, health, backup/restore, role-smoke, and release-identity gates before activation. Before mutation, the candidate identity MUST contain the same full SHA for the reviewed commit, immutable candidate release directory, and candidate activation argument. The rollback identity MUST contain the same full SHA for the pre-activation `current` target and declared rollback argument; it MUST differ from the candidate SHA and resolve to an immutable verified compatible release. After successful activation, `current` MUST resolve to the candidate SHA. Any candidate or rollback identity mismatch or preflight failure MUST stop the handoff before `current` or PM2 changes. Rollback MUST restore the declared verified compatible release without crossing an unapproved data change.

#### Scenario: Release passes all gates
- GIVEN all required evidence is current and passing
- AND the candidate and rollback identities are valid
- WHEN the release is activated
- THEN the validated candidate version serves through HTTPS
- AND before mutation, the candidate identity values are equal and the rollback identity values are equal but distinct from the candidate SHA
- AND after successful activation, `current` resolves to the candidate SHA

#### Scenario: Candidate or rollback identity mismatch
- GIVEN a candidate identity value differs, or the pre-activation `current` target and declared rollback argument differ, match the candidate SHA, or do not resolve to an immutable verified compatible release
- WHEN the release preflight runs
- THEN activation is rejected before any symlink or PM2 change
- AND the mismatch is recorded without secrets

#### Scenario: Pre-activation gate failure
- GIVEN a required gate fails before release mutation
- WHEN the release is rejected
- THEN `current` and PM2 remain unchanged, and the failure is recorded

#### Scenario: Post-activation failure
- GIVEN release mutation has begun and the new version is unhealthy
- WHEN release recovery is initiated
- THEN `current` is restored to the declared verified compatible rollback release, traffic is revalidated, and the failure is recorded

### Requirement: Explicit post-success release rollback
After a successful activation, an authorized operator MAY invoke the root-only activation script as `--rollback <expected-current-sha> <target-old-sha>`. Before mutation, the script MUST validate distinct full lowercase SHA identities, root execution, both immutable releases, that `current` resolves exactly to the expected-current release, and the configured root-owned pinned Node 24 and Node 20 runtimes. It MUST delete the serving PM2 app through Node 24, atomically switch `current` to the target-old release, start it through Node 20, and require loopback HTTP 200 plus a stable PID, executable, and working directory. It MUST verify that `current` remains a symlink resolving exactly to the selected release after startup and again after health and process proof, for both target-old rollback and expected-current recovery. Every outcome MUST emit a sanitized UTC receipt containing both SHAs and the exit status. If rollback fails after mutation begins, it MUST attempt to restore and prove the expected-current release and MUST NOT report rollback success when the outcome is uncertain. This mode MUST NOT mutate protected secrets, Google OAuth configuration, MongoDB identities, account roles, credentials, or other application data.

#### Scenario: Operator rolls back a successful release
- GIVEN the expected-current and target-old releases are distinct, immutable, and valid
- AND `current` resolves exactly to the expected-current release
- AND the root-owned pinned runtime checks pass
- WHEN the root-only activation script is invoked with `--rollback <expected-current-sha> <target-old-sha>`
- THEN the serving app is deleted through Node 24, `current` is atomically switched to target-old, and target-old is started through Node 20
- AND rollback is reported as passed only after loopback HTTP 200 and stable Node 20 PID, executable, and working directory are proved
- AND the sanitized UTC receipt contains both exact SHAs and status
- AND secrets, OAuth configuration, MongoDB identities, and account roles remain unchanged

#### Scenario: Post-success rollback fails after mutation begins
- GIVEN explicit rollback has begun
- WHEN the target-old release cannot start or fails health or process-identity proof
- THEN the command returns nonzero and attempts to restore and prove the expected-current release
- AND the receipt reports rollback failure and the recovery result without exposing secrets
- AND it does not claim that either release is serving successfully unless that state was proved

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

### Requirement: Optional receipt-only managed-release diagnostic

Receipt-only mode is an optional, non-mutating diagnostic; it is not a deployment gate. When invoked, it MUST accept only an approved non-secret endpoint selector and owner/group/mode comparison policy. It MUST make exactly one non-mutating remote query to derive the active managed release and effective root, validate the canonical immutable release relationship and policy, and emit a sanitized receipt with `release`, `execution_class`, `connection_count`, `identity`, `metadata`, `effective_root`, `transfer`, `preparation`, and `activation`. `execution_class=remote_command_failure` MUST identify a nonzero SSH exit, `execution_class=invalid_remote_output` MUST identify a successful SSH exit with invalid managed-release output, and `execution_class=success` MUST identify valid remote execution and output.

It MUST not archive, transfer, prepare, activate, manage services, retry, infer unobserved release evidence, or classify an external caller-side capture failure. Missing selector or policy MUST fail locally; malformed, ambiguous, or mismatched query output MUST fail closed after at most one query. Diagnostic absence or failure MUST make no production-state claim and MUST NOT authorize mutation.

#### Scenario: Receipt-only diagnostic establishes bounded evidence
- GIVEN an approved selector and complete comparison policy
- WHEN the optional receipt-only diagnostic runs
- THEN one remote query derives the active release and effective root
- AND the receipt reports `connection_count=1`, the applicable `execution_class`, identity and metadata outcomes, and `transfer=absent`, `preparation=absent`, and `activation=absent`
- AND reviewed commit, activation-script SHA, `current` target, and runtime health remain explicitly unverified unless separately evidenced

#### Scenario: Receipt-only diagnostic is absent or fails
- GIVEN the optional diagnostic is not run or does not produce a valid receipt
- WHEN an operator evaluates production state or activation authority
- THEN the diagnostic makes no production-state claim
- AND it does not authorize transfer, preparation, activation, service management, or any other mutation
