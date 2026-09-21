# VPS Node 24 Readiness

## Goal

Prepare the VPS with a side-by-side, verified Node 24 runtime and the non-secret runtime configuration required by the release preparer, without changing the active release, PM2 process, Nginx, database, or public traffic.

## Scope

- Install a pinned Node 24 runtime beside the existing Node 20 runtime.
- Create `/srv/botanica-ob/config/node24-runtime.conf` with paths and versions only.
- Validate ownership, modes, runtime identities, and unchanged serving state.

## Non-goals

- No release preparation or activation.
- No PM2, Nginx, MongoDB, DNS, TLS, OAuth, secret, backup, or user-account changes.
- No modification of `/srv/botanica-ob/current`.

## Tasks

- [x] 1. Pin and verify the Node 24 distribution artifact and define the side-by-side installation/rollback commands.
  - Evidence: VPS is `x86_64`; use official Node `v24.20.0` Linux x64 archive `node-v24.20.0-linux-x64.tar.xz`, SHA-256 `2f2c0da162318f0de47665410c7c8c2ed3d36c8f3105de4bbc61176c70a7cbf2`, from `https://nodejs.org/dist/v24.20.0/SHASUMS256.txt`. Install root-owned runtime at `/opt/node-v24.20.0`; no current symlink, PM2, or service operation is in scope. Rollback is removal of the inert `/opt/node-v24.20.0` directory and `/srv/botanica-ob/config/node24-runtime.conf` only after a failed validation; Node 20 remains at `/usr/bin/node`.
- [x] 2. Install the side-by-side Node 24 runtime and write the root-owned runtime configuration.
  - Evidence: official archive SHA-256 passed; Node `v24.20.0` and npm `11.19.0` are installed at `/opt/node-v24.20.0`. The config is `root:root` mode `0600`, has the required fixed 12-line shape, and all runtime files are root-owned canonical regular files without group/other write permissions. Existing Node 20 (`v20.20.2`) and PM2 CLI (`7.0.3`) remain available as the rollback runtime.
- [x] 3. Verify unchanged service state and record sanitized readiness evidence.
  - Evidence: active release remains `9bca5edc4567eee38eb57c6997ec2354f98f1219`; default Node/npm remain `v20.20.2`/`10.8.2`; Nginx is active; PM2 is online with the same PID `2647`; loopback health is `200`; and public/loopback listeners match the preflight. No activation occurred.

## Evidence

- Preflight: active release `9bca5edc4567eee38eb57c6997ec2354f98f1219`; Node `v20.20.2`; npm `10.8.2`; PM2 `7.0.3`; Nginx active; loopback health 200.
- Recovery discovery: the host has root-owned `mongo-backup.sh` and `mongo-restore-isolated.sh` scripts plus six files in `/srv/botanica-ob/backups`, but the set totals only 3,302 bytes (largest 1,635 bytes) and has no restore-rehearsal artifacts. It is not evidence of a recoverable MongoDB backup. Database backup/isolated restore is parked in issue #99; this Node sidecar slice did not modify data, releases, or traffic.

## Key Learnings

- The Node 24 sidecar remains inert until a future release preparer explicitly selects it; Node 20 and the existing PM2 CLI remain the rollback runtime.
- A privileged SSH write rejected by the local safety guard must not be retried or bypassed, even with owner authorization for the bounded change.
- If post-creation validation fails, rollback is limited to `/opt/node-v24.20.0` and `/srv/botanica-ob/config/node24-runtime.conf`.

## Delivery

- Branch: `chore/vps-node24-readiness`.
- Commit each completed work unit after its checks pass.
- Push is mandatory after every commit.
- PR and merge require explicit authorization.
