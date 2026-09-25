# Tasks: Direct Production Deployment

## Operating Model

These three operational milestones replace the former granular delivery ceremony. They retain the safety outcomes while giving the operator one clear progression.

### Completed repository foundations

- [x] Reviewed dependency and Node.js 24 LTS runtime baseline, reviewed authentication policy, safe health/PM2 configuration, protected provisioning scripts, and local four-role denial coverage.
- [x] POSIX release preparation and activation contracts with focused local checks for identity, ownership, runtime selection, preparation, and rollback guards.

Repository evidence does not establish VPS state. Every unchecked milestone below requires current, timestamped, sanitized operational evidence for one candidate SHA.

## Milestone 1 — Host readiness

- [ ] Create application, immutable-release, configuration, and log directories with verified ownership and permissions; record the Node.js 24 LTS, npm, and PM2 runtime versions.
- [ ] Run MongoDB as authenticated persistent storage on loopback only; prove an authenticated loopback connection and external-network refusal.
- [ ] Configure backups and prove an isolated restore before production data is accepted.
- [ ] Provision protected Admin and Olga accounts through reviewed scripts and root-only secrets; prove their login flows without recording credentials.
- [ ] Set authoritative DNS and configure Nginx for HTTPS with a loopback-only application upstream; issue and validate TLS.

**Stop / rollback:** Any missing or failed readiness check is NO-GO. Do not transfer a candidate, alter `current`, or manage PM2. Revert only the affected host configuration to its prior known-safe state.

## Milestone 2 — Candidate preparation and activation

- [ ] Establish separate candidate and rollback identities before activation. Candidate: the reviewed commit SHA, immutable candidate release-directory SHA, and candidate activation argument must match exactly. Rollback: the pre-activation `current` target and declared rollback argument must match each other, differ from the candidate SHA, and identify an immutable verified release.
- [ ] Prepare and seal the candidate with the fixed Node.js 24 runtime configuration. Retain the verified rollback release as the declared rollback target.
- [ ] Before any mutation, verify POSIX-compatible handoff behavior, remote identity, release-path owner/group/mode, root-only secret checks, build validation, and loopback health.
- [ ] After explicit operator approval, run only the root-owned activation script. It must atomically replace `current` and manage PM2. After successful activation, verify and record that `current` resolves to the candidate full SHA, then prove loopback health plus a stable process PID and working directory.

**Stop / rollback:** A missing SHA, mismatch, mutable release, failed preflight, failed health check, or unstable process stops before `current` or PM2 changes. If the candidate becomes unhealthy after activation, atomically restore the retained verified release, restart it through the approved runtime, and revalidate loopback traffic. Do not cross an unapproved data change.

## Milestone 3 — Public acceptance

- [ ] Confirm public HTTPS redirect, TLS certificate validity, callbacks, and login behavior for anonymous visitors, subscriber, Olga, and Admin, including their required denial cases.
- [ ] Review release-aligned, sanitized PM2 and Nginx logs; confirm backup status, an isolated restore record, ACME test diagnosis, and TLS-renewal evidence.
- [ ] Remove temporary protected credentials and retain only non-secret evidence of cleanup.
- [ ] Record a named operator's explicit acceptance decision for the candidate SHA.

**Stop / rollback:** A failed, missing, ambiguous, or unsanitized acceptance record is NO-GO. Keep the prior verified release serving, or roll back atomically to it if activation occurred. Do not claim public acceptance until every item passes.
