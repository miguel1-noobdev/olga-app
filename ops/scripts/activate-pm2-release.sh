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
readonly RELEASE_ID="${1:-}"
readonly RELEASE_DIR="$APP_ROOT/releases/$RELEASE_ID"
readonly CURRENT_LINK="$APP_ROOT/current"
readonly SECRETS_FILE="${SECRETS_FILE:-/etc/botanica-ob/secrets.env}"
readonly RUNTIME_CONFIG="$APP_ROOT/config/node24-runtime.conf"
readonly PM2_APP="botanica-ob"
readonly PM2_CONFIG="$RELEASE_DIR/ops/pm2/ecosystem.config.cjs"
readonly HEALTH_URL="http://127.0.0.1:3000/api/health"
readonly HEALTH_TIMEOUT_SECONDS=30
readonly HEALTH_RETRY_INTERVAL_SECONDS=1

activation_started=0
previous_current_exists=0
previous_target=""
previous_pm2_running=0
current_tmp=""
restore_tmp=""

die() {
  printf '%s\n' "$1" >&2
  exit 1
}

mode_permissions() {
  case "$1" in [0-7][0-7][0-7]) runtime_mode="$1" ;; [0-7][0-7][0-7][0-7]) runtime_mode="${1#?}" ;; *) return 1 ;; esac
}

validate_runtime_file() {
  local path="$1" label="$2" executable="$3" metadata canonical
  [[ -f "$path" && ! -L "$path" && -r "$path" ]] || die "Node 24 $label is unavailable."
  [[ "$executable" == 0 || -x "$path" ]] || die 'Node 24 runtime is not executable.'
  canonical="$(realpath -- "$path" 2>/dev/null)" || die 'Node 24 runtime path is invalid.'
  [[ "$canonical" == "$path" ]] || die 'Node 24 runtime path is not canonical.'
  metadata="$(stat -c '%U %a' "$path" 2>/dev/null)" || die "Node 24 $label metadata is unavailable."
  [[ "${metadata%% *}" == root ]] && mode_permissions "${metadata##* }" || die "Node 24 $label metadata is invalid."
  [[ "${runtime_mode:1}" != *[2367]* ]] || die "Node 24 $label is writable."
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
  case "$node20_line" in NODE20_BIN=*) ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$node20_version_line" in NODE20_VERSION=*) ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$node20_pm2_line" in NODE20_PM2_CLI=*) ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$node20_pm2_version_line" in NODE20_PM2_VERSION=*) ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$pm2_line" in NODE24_PM2_CLI=*) NODE24_PM2_CLI="${pm2_line#NODE24_PM2_CLI=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$pm2_version_line" in NODE24_PM2_VERSION=*) NODE24_PM2_VERSION="${pm2_version_line#NODE24_PM2_VERSION=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$run_as_line" in PM2_RUN_AS=*) PM2_RUN_AS="${run_as_line#PM2_RUN_AS=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  case "$home_line" in PM2_HOME=*) PM2_HOME="${home_line#PM2_HOME=}" ;; *) die 'Node 24 runtime configuration shape is invalid.' ;; esac
  [[ "$NODE24_BIN" == /* && "$NODE24_PM2_CLI" == /* && "$PM2_HOME" == /* && -n "$PM2_RUN_AS" ]] || die 'Node 24 runtime paths are invalid.'
  validate_runtime_file "$NODE24_BIN" runtime 1
  validate_runtime_file "$NODE24_PM2_CLI" PM2_CLI 0
  [[ "$NODE24_VERSION" =~ ^v24\.[0-9]+\.[0-9]+$ && "$NODE24_PM2_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die 'Node 24 runtime versions are invalid.'
  [[ "$("$NODE24_BIN" --version 2>/dev/null)" == "$NODE24_VERSION" ]] || die 'Node 24 runtime version drift.'
  pm2_uid="$(id -u "$PM2_RUN_AS" 2>/dev/null)" || die 'Configured PM2 account is unavailable.'
  [[ "$pm2_uid" =~ ^[0-9]+$ && -d "$PM2_HOME" && "$(stat -c '%u' "$PM2_HOME" 2>/dev/null)" == "$pm2_uid" ]] || die 'Configured PM2 home is invalid.'
  PM2_NODE_BIN="$NODE24_BIN"
  [[ "$(run_pm2 "$RELEASE_DIR" --version 2>/dev/null)" == "$NODE24_PM2_VERSION" ]] || die 'Node 24 PM2 version drift.'
}

run_pm2() {
  PM2_CWD="$1"; shift
  export PM2_HOME PM2_NODE_BIN PM2_CWD
  runuser --preserve-environment --user "$PM2_RUN_AS" -- "$NODE24_BIN" "$NODE24_PM2_CLI" "$@"
}

rollback() {
  local status=$?
  trap - EXIT
  set +e

  if (( activation_started == 1 )); then
    run_pm2 "$RELEASE_DIR" delete "$PM2_APP" >/dev/null 2>&1 || true

    if (( previous_current_exists == 1 )); then
      restore_tmp="$APP_ROOT/.current.rollback.$$"
      rm -f "$restore_tmp"
      ln -s "$previous_target" "$restore_tmp"
      mv -Tf "$restore_tmp" "$CURRENT_LINK"
    else
      rm -f "$CURRENT_LINK"
    fi

    if (( previous_pm2_running == 1 )); then
      run_pm2 "$CURRENT_LINK" start "$CURRENT_LINK/ops/pm2/ecosystem.config.cjs" --only "$PM2_APP" --update-env \
        >/dev/null 2>&1 || true
    fi
  fi

  rm -f "$current_tmp" "$restore_tmp"
  if (( status != 0 )); then
    printf '%s\n' 'activation=failed; rollback=attempted' >&2
  fi
  exit "$status"
}

trap rollback EXIT

if (( $# != 1 )) || ! [[ "$RELEASE_ID" =~ ^[0-9a-f]{40}$ ]]; then
  die 'A full 40-character lowercase Git SHA is required.'
fi

if [[ ! -d "$RELEASE_DIR" || ! -f "$PM2_CONFIG" ]]; then
  die "Prepared immutable release is unavailable: $RELEASE_ID"
fi

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

if [[ -n "$(find "$RELEASE_DIR" -type f -perm /0222 -print -quit)" ]]; then
  die 'Prepared release contains writable files.'
fi

if [[ -L "$CURRENT_LINK" ]]; then
  previous_current_exists=1
  previous_target="$(readlink "$CURRENT_LINK")"
elif [[ -e "$CURRENT_LINK" ]]; then
  die 'Current release path is not a symlink.'
fi

PM2_NODE_BIN="$NODE24_BIN"
if run_pm2 "$RELEASE_DIR" describe "$PM2_APP" >/dev/null 2>&1; then
  previous_pm2_running=1
fi

current_tmp="$APP_ROOT/.current.$$"
rm -f "$current_tmp"
ln -s "$RELEASE_DIR" "$current_tmp"
activation_started=1
mv -Tf "$current_tmp" "$CURRENT_LINK"

run_pm2 "$RELEASE_DIR" delete "$PM2_APP" >/dev/null 2>&1 || true
run_pm2 "$RELEASE_DIR" start "$PM2_CONFIG" --only "$PM2_APP" --update-env >/dev/null 2>&1

health_deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
until health_status="$(curl --fail --silent --show-error --max-time 5 --output /dev/null --write-out '%{http_code}' "$HEALTH_URL")" && [[ "$health_status" == "200" ]]; do
  if (( SECONDS >= health_deadline )); then
    die 'Loopback health check failed before readiness deadline.'
  fi
  sleep "$HEALTH_RETRY_INTERVAL_SECONDS"
done

candidate_pid="$(run_pm2 "$RELEASE_DIR" pid "$PM2_APP" 2>/dev/null)"
sleep "$HEALTH_RETRY_INTERVAL_SECONDS"
stable_pid="$(run_pm2 "$RELEASE_DIR" pid "$PM2_APP" 2>/dev/null)"
if ! [[ "$candidate_pid" =~ ^[1-9][0-9]*$ ]] || [[ "$stable_pid" != "$candidate_pid" ]] ||
  [[ "$(readlink -f "/proc/$candidate_pid/exe" 2>/dev/null)" != "$NODE24_BIN" ]] ||
  [[ "$(readlink -f "/proc/$candidate_pid/cwd" 2>/dev/null)" != "$RELEASE_DIR" ]]; then
  die 'Candidate process identity is not stable.'
fi

trap - EXIT
printf 'activation=passed release=%s\n' "$RELEASE_ID"
