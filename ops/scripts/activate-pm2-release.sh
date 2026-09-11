#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

readonly PRODUCTION_APP_ROOT="/srv/botanica-ob"

is_unprivileged_user_namespace() {
  local inside_uid outside_uid range
  read -r inside_uid outside_uid range < /proc/self/uid_map || return 1
  [[ "$inside_uid" == 0 && "$outside_uid" =~ ^[1-9][0-9]*$ && "$range" == 1 ]]
}

if [[ -n ${APP_ROOT:-} && "$APP_ROOT" != "$PRODUCTION_APP_ROOT" ]] && ! is_unprivileged_user_namespace; then
  printf '%s\n' 'Application root override requires an unprivileged user namespace.' >&2
  exit 1
fi

readonly APP_ROOT="${APP_ROOT:-$PRODUCTION_APP_ROOT}"
readonly CANDIDATE_SHA="${1:-}"
readonly ROLLBACK_SHA="${2:-}"
readonly RELEASE_DIR="$APP_ROOT/releases/$CANDIDATE_SHA"
readonly ROLLBACK_DIR="$APP_ROOT/releases/$ROLLBACK_SHA"
readonly CURRENT_LINK="$APP_ROOT/current"
readonly SECRETS_FILE="${SECRETS_FILE:-/etc/botanica-ob/secrets.env}"
readonly RUNTIME_CONFIG="$APP_ROOT/config/node24-runtime.conf"
readonly PM2_APP="botanica-ob"
readonly PM2_CONFIG="$RELEASE_DIR/ops/pm2/ecosystem.config.cjs"
readonly HEALTH_URL="http://127.0.0.1:3000/api/health"
readonly HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-30}"
readonly HEALTH_RETRY_INTERVAL_SECONDS=1

activation_started=0
current_tmp=""
restore_tmp=""

die() {
  printf '%s\n' "$1" >&2
  exit 1
}

validate_release() {
  local release_sha="$1" release_dir="$2"
  [[ "$(realpath -- "$APP_ROOT" 2>/dev/null)" == "$APP_ROOT" && "$(realpath -- "$release_dir" 2>/dev/null)" == "$release_dir" ]] ||
    die "Prepared immutable release is unavailable: $release_sha"
  [[ -f "$release_dir/ops/pm2/ecosystem.config.cjs" ]] || die "Prepared immutable release is unavailable: $release_sha"
  [[ -z "$(find "$release_dir" \( -type f -o -type d \) -perm /0222 -print -quit)" ]] || die 'Prepared release contains writable files.'
}

mode_permissions() {
  case "$1" in [0-7][0-7][0-7]) runtime_mode="$1" ;; [0-7][0-7][0-7][0-7]) runtime_mode="${1#?}" ;; *) return 1 ;; esac
}

validate_runtime_file() {
  local path="$1" runtime="$2" label="$3" executable="$4" metadata canonical
  [[ -f "$path" && ! -L "$path" && -r "$path" ]] || die "Node $runtime $label is unavailable."
  [[ "$executable" == 0 || -x "$path" ]] || die "Node $runtime runtime is not executable."
  canonical="$(realpath -- "$path" 2>/dev/null)" || die "Node $runtime runtime path is invalid."
  [[ "$canonical" == "$path" ]] || die "Node $runtime runtime path is not canonical."
  metadata="$(stat -c '%U %a' "$path" 2>/dev/null)" || die "Node $runtime $label metadata is unavailable."
  [[ "${metadata%% *}" == root ]] && mode_permissions "${metadata##* }" || die "Node $runtime $label metadata is invalid."
  [[ "${runtime_mode:1}" != *[2367]* ]] || die "Node $runtime $label is writable."
}

load_runtime() {
  local metadata node_line node_version_line npm_line npm_version_line node20_line node20_version_line node20_pm2_line node20_pm2_version_line pm2_line pm2_version_line run_as_line home_line
  [[ -f "$RUNTIME_CONFIG" && ! -L "$RUNTIME_CONFIG" && -r "$RUNTIME_CONFIG" ]] || die 'Node 24 runtime configuration is unavailable.'
  metadata="$(stat -c '%U %a' "$RUNTIME_CONFIG" 2>/dev/null)" || die 'Node 24 runtime configuration metadata is unavailable.'
  [[ "${metadata%% *}" == root ]] && mode_permissions "${metadata##* }" || die 'Node 24 runtime configuration metadata is invalid.'
  [[ "${runtime_mode:1}" != *[2367]* ]] || die 'Node 24 runtime configuration is writable.'
  {
    IFS= read -r node_line && IFS= read -r node_version_line && IFS= read -r npm_line && IFS= read -r npm_version_line &&
    IFS= read -r node20_line && IFS= read -r node20_version_line && IFS= read -r node20_pm2_line && IFS= read -r node20_pm2_version_line &&
    IFS= read -r pm2_line && IFS= read -r pm2_version_line && IFS= read -r run_as_line && IFS= read -r home_line && ! IFS= read -r _extra
  } < "$RUNTIME_CONFIG" || die 'Node 24 runtime configuration shape is invalid.'
  case "$node_line" in NODE24_BIN=*) NODE24_BIN="${node_line#NODE24_BIN=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$node_version_line" in NODE24_VERSION=*) NODE24_VERSION="${node_version_line#NODE24_VERSION=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$npm_line" in NODE24_NPM_CLI=*) ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$npm_version_line" in NODE24_NPM_VERSION=*) ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$node20_line" in NODE20_BIN=*) NODE20_BIN="${node20_line#NODE20_BIN=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$node20_version_line" in NODE20_VERSION=*) NODE20_VERSION="${node20_version_line#NODE20_VERSION=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$node20_pm2_line" in NODE20_PM2_CLI=*) NODE20_PM2_CLI="${node20_pm2_line#NODE20_PM2_CLI=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$node20_pm2_version_line" in NODE20_PM2_VERSION=*) NODE20_PM2_VERSION="${node20_pm2_version_line#NODE20_PM2_VERSION=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$pm2_line" in NODE24_PM2_CLI=*) NODE24_PM2_CLI="${pm2_line#NODE24_PM2_CLI=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$pm2_version_line" in NODE24_PM2_VERSION=*) NODE24_PM2_VERSION="${pm2_version_line#NODE24_PM2_VERSION=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$run_as_line" in PM2_RUN_AS=*) PM2_RUN_AS="${run_as_line#PM2_RUN_AS=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$home_line" in PM2_HOME=*) PM2_HOME="${home_line#PM2_HOME=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  [[ "$NODE24_BIN" == /* && "$NODE20_BIN" == /* && "$NODE20_PM2_CLI" == /* && "$NODE24_PM2_CLI" == /* && "$PM2_HOME" == /* && -n "$PM2_RUN_AS" ]] || die 'Node runtime paths are invalid.'
  validate_runtime_file "$NODE24_BIN" 24 runtime 1
  validate_runtime_file "$NODE24_PM2_CLI" 24 PM2_CLI 0
  validate_runtime_file "$NODE20_BIN" 20 runtime 1
  validate_runtime_file "$NODE20_PM2_CLI" 20 PM2_CLI 0
  [[ "$NODE24_VERSION" =~ ^v24\.[0-9]+\.[0-9]+$ && "$NODE20_VERSION" =~ ^v20\.[0-9]+\.[0-9]+$ && "$NODE24_PM2_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ && "$NODE20_PM2_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die 'Node runtime versions are invalid.'
  [[ "$("$NODE24_BIN" --version 2>/dev/null)" == "$NODE24_VERSION" ]] || die 'Node 24 runtime version drift.'
  [[ "$("$NODE20_BIN" --version 2>/dev/null)" == "$NODE20_VERSION" ]] || die 'Node 20 runtime version drift.'
  pm2_uid="$(id -u "$PM2_RUN_AS" 2>/dev/null)" || die 'Configured PM2 account is unavailable.'
  [[ "$pm2_uid" =~ ^[0-9]+$ && -d "$PM2_HOME" && "$(stat -c '%u' "$PM2_HOME" 2>/dev/null)" == "$pm2_uid" ]] || die 'Configured PM2 home is invalid.'
  [[ "$(run_node24_pm2 "$RELEASE_DIR" --version 2>/dev/null)" == "$NODE24_PM2_VERSION" ]] || die 'Node 24 PM2 version drift.'
  [[ "$(run_node20_pm2 "$ROLLBACK_DIR" --version 2>/dev/null)" == "$NODE20_PM2_VERSION" ]] || die 'Node 20 PM2 version drift.'
}

run_node24_pm2() {
  PM2_NODE_BIN="$NODE24_BIN" PM2_CWD="$1"; shift
  export PM2_HOME PM2_NODE_BIN PM2_CWD
  runuser --preserve-environment --user "$PM2_RUN_AS" -- "$NODE24_BIN" "$NODE24_PM2_CLI" "$@"
}

run_node20_pm2() {
  PM2_NODE_BIN="$NODE20_BIN" PM2_CWD="$1"; shift
  export PM2_HOME PM2_NODE_BIN PM2_CWD
  runuser --preserve-environment --user "$PM2_RUN_AS" -- "$NODE20_BIN" "$NODE20_PM2_CLI" "$@"
}

wait_for_health() {
  local health_deadline health_status
  health_deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
  until health_status="$(curl --fail --silent --show-error --max-time 5 --output /dev/null --write-out '%{http_code}' "$HEALTH_URL")" && [[ "$health_status" == "200" ]]; do
    (( SECONDS < health_deadline )) || return 1
    sleep "$HEALTH_RETRY_INTERVAL_SECONDS"
  done
}

rollback() {
  local status=$? recovery=passed rollback_pid stable_pid
  trap - EXIT
  set +e

  if (( activation_started == 1 )); then
    run_node24_pm2 "$RELEASE_DIR" delete "$PM2_APP" >/dev/null 2>&1 || recovery=failed
    restore_tmp="$APP_ROOT/.current.rollback.$$"
    if ! rm -f "$restore_tmp" || ! ln -s "$ROLLBACK_DIR" "$restore_tmp" || ! mv -Tf "$restore_tmp" "$CURRENT_LINK" ||
      [[ "$(realpath -- "$CURRENT_LINK" 2>/dev/null)" != "$ROLLBACK_DIR" ]]; then
      recovery=failed
    fi
    run_node20_pm2 "$ROLLBACK_DIR" start "$ROLLBACK_DIR/ops/pm2/ecosystem.config.cjs" --only "$PM2_APP" --update-env \
      >/dev/null 2>&1 || recovery=failed
    wait_for_health || recovery=failed
    rollback_pid="$(run_node20_pm2 "$ROLLBACK_DIR" pid "$PM2_APP" 2>/dev/null)"
    sleep "$HEALTH_RETRY_INTERVAL_SECONDS"
    stable_pid="$(run_node20_pm2 "$ROLLBACK_DIR" pid "$PM2_APP" 2>/dev/null)"
    if ! [[ "$rollback_pid" =~ ^[1-9][0-9]*$ ]] || [[ "$stable_pid" != "$rollback_pid" ]] ||
      [[ "$(readlink -f "/proc/$rollback_pid/exe" 2>/dev/null)" != "$NODE20_BIN" ]] ||
      [[ "$(readlink -f "/proc/$rollback_pid/cwd" 2>/dev/null)" != "$ROLLBACK_DIR" ]]; then
      recovery=failed
    fi
    printf 'activation=failed; rollback=%s\n' "$recovery" >&2
  fi

  rm -f "$current_tmp" "$restore_tmp"
  exit "$status"
}

trap rollback EXIT

if (( $# != 2 )) || ! [[ "$CANDIDATE_SHA" =~ ^[0-9a-f]{40}$ && "$ROLLBACK_SHA" =~ ^[0-9a-f]{40}$ ]] || [[ "$CANDIDATE_SHA" == "$ROLLBACK_SHA" ]]; then
  die 'Distinct full 40-character lowercase candidate and rollback Git SHAs are required.'
fi
[[ "$HEALTH_TIMEOUT_SECONDS" =~ ^[0-9]+$ ]] || die 'Health timeout is invalid.'

validate_release "$CANDIDATE_SHA" "$RELEASE_DIR"
validate_release "$ROLLBACK_SHA" "$ROLLBACK_DIR"

if ! [[ "$(id -u)" == "0" ]]; then
  die 'Activation must run as root.'
fi

load_runtime

if [[ ! -f "$SECRETS_FILE" ]]; then
  die 'Production secrets file is unavailable.'
fi
if ! [[ "$(stat -c '%u' "$SECRETS_FILE")" == "0" ]]; then
  die 'Production secrets file must be root-owned.'
fi
if ! [[ "$(stat -c '%a' "$SECRETS_FILE")" == "600" ]]; then
  die 'Production secrets file must be mode 0600.'
fi

set -a
if ! . "$SECRETS_FILE" >/dev/null 2>&1; then
  set +a
  die 'Production secrets file could not be loaded.'
fi
set +a

if [[ -z ${MONGODB_URI:-} ]]; then
  mongo_required_vars=(
    MONGO_INITDB_ROOT_USERNAME
    MONGO_INITDB_ROOT_PASSWORD
  )
  for required_var in "${mongo_required_vars[@]}"; do
    if ! [[ -n ${!required_var:-} ]]; then
      die "Required production variable is missing: $required_var"
    fi
  done

  MONGODB_URI="mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@127.0.0.1:27017/botanica-ob?authSource=admin"
  export MONGODB_URI
fi

required_vars=(
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  INTERNAL_ACCOUNT_CHECK_ORIGIN
)
for required_var in "${required_vars[@]}"; do
  if ! [[ -n ${!required_var:-} ]]; then
    die "Required production variable is missing: $required_var"
  fi
done

if ! [[ -L "$CURRENT_LINK" ]] || [[ "$(realpath -- "$CURRENT_LINK" 2>/dev/null)" != "$ROLLBACK_DIR" ]]; then
  die 'Current release does not match declared rollback SHA.'
fi

run_node24_pm2 "$RELEASE_DIR" describe "$PM2_APP" >/dev/null 2>&1 || true

current_tmp="$APP_ROOT/.current.$$"
rm -f "$current_tmp"
ln -s "$RELEASE_DIR" "$current_tmp"
activation_started=1
mv -Tf "$current_tmp" "$CURRENT_LINK"

run_node24_pm2 "$RELEASE_DIR" delete "$PM2_APP" >/dev/null 2>&1 || true
run_node24_pm2 "$RELEASE_DIR" start "$PM2_CONFIG" --only "$PM2_APP" --update-env >/dev/null 2>&1

wait_for_health || die 'Loopback health check failed before readiness deadline.'

candidate_pid="$(run_node24_pm2 "$RELEASE_DIR" pid "$PM2_APP" 2>/dev/null)"
sleep "$HEALTH_RETRY_INTERVAL_SECONDS"
stable_pid="$(run_node24_pm2 "$RELEASE_DIR" pid "$PM2_APP" 2>/dev/null)"
if ! [[ "$candidate_pid" =~ ^[1-9][0-9]*$ ]] || [[ "$stable_pid" != "$candidate_pid" ]] ||
  [[ "$(readlink -f "/proc/$candidate_pid/exe" 2>/dev/null)" != "$NODE24_BIN" ]] ||
  [[ "$(readlink -f "/proc/$candidate_pid/cwd" 2>/dev/null)" != "$RELEASE_DIR" ]]; then
  die 'Candidate process identity is not stable.'
fi

trap - EXIT
printf 'activation=passed release=%s\n' "$CANDIDATE_SHA"
