#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

readonly APP_ROOT="/srv/botanica-ob"
readonly RELEASE_ID="b050790d8dc7ab9638dd74217c18cd770043401f"
readonly RELEASE_DIR="$APP_ROOT/releases/$RELEASE_ID"
readonly CURRENT_LINK="$APP_ROOT/current"
readonly SECRETS_FILE="/etc/botanica-ob/secrets.env"
readonly PM2_APP="botanica-ob"
readonly PM2_CONFIG="$RELEASE_DIR/ops/pm2/ecosystem.config.cjs"
readonly RUN_AS="migue"
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

run_pm2() {
  runuser --preserve-environment --user "$RUN_AS" -- pm2 "$@"
}

rollback() {
  local status=$?
  trap - EXIT
  set +e

  if (( activation_started == 1 )); then
    run_pm2 delete "$PM2_APP" >/dev/null 2>&1 || true

    if (( previous_current_exists == 1 )); then
      restore_tmp="$APP_ROOT/.current.rollback.$$"
      rm -f "$restore_tmp"
      ln -s "$previous_target" "$restore_tmp"
      mv -Tf "$restore_tmp" "$CURRENT_LINK"
    else
      rm -f "$CURRENT_LINK"
    fi

    if (( previous_pm2_running == 1 )); then
      run_pm2 start "$CURRENT_LINK/ops/pm2/ecosystem.config.cjs" --only "$PM2_APP" --update-env \
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

if ! [[ "$(id -u)" == "0" ]]; then
  die 'Activation must run as root.'
fi

if ! id "$RUN_AS" >/dev/null 2>&1; then
  die 'Required PM2 user is unavailable.'
fi

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

if [[ ! -d "$RELEASE_DIR" || ! -f "$PM2_CONFIG" ]]; then
  die 'Prepared immutable release is unavailable.'
fi
if [[ -n "$(find "$RELEASE_DIR" -type f -perm /0222 -print -quit)" ]]; then
  die 'Prepared release contains writable files.'
fi

if [[ -L "$CURRENT_LINK" ]]; then
  previous_current_exists=1
  previous_target="$(readlink "$CURRENT_LINK")"
elif [[ -e "$CURRENT_LINK" ]]; then
  die 'Current release path is not a symlink.'
fi

export PM2_HOME="/home/migue/.pm2"
if run_pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  previous_pm2_running=1
fi

current_tmp="$APP_ROOT/.current.$$"
rm -f "$current_tmp"
ln -s "$RELEASE_DIR" "$current_tmp"
activation_started=1
mv -Tf "$current_tmp" "$CURRENT_LINK"

run_pm2 delete "$PM2_APP" >/dev/null 2>&1 || true
run_pm2 start "$PM2_CONFIG" --only "$PM2_APP" --update-env >/dev/null 2>&1

health_deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
until health_status="$(curl --fail --silent --show-error --max-time 5 --output /dev/null --write-out '%{http_code}' "$HEALTH_URL")" && [[ "$health_status" == "200" ]]; do
  if (( SECONDS >= health_deadline )); then
    die 'Loopback health check failed before readiness deadline.'
  fi
  sleep "$HEALTH_RETRY_INTERVAL_SECONDS"
done

trap - EXIT
printf 'activation=passed release=%s\n' "$RELEASE_ID"
