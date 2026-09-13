#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

child_log=""
activation_pid=""
fault_pid=""

finish() {
  trap - EXIT
  [[ -z "$fault_pid" ]] || { kill -TERM "$fault_pid" 2>/dev/null || true; wait "$fault_pid" 2>/dev/null || true; }
  [[ -z "$activation_pid" ]] || { kill -TERM -- "-$activation_pid" 2>/dev/null || true; wait "$activation_pid" 2>/dev/null || true; }
  [[ -z "$child_log" ]] || rm -f -- "$child_log"
}
trap finish EXIT

fail() {
  printf 'rehearsal=failed stage=%s\n' "$1" >&2
  exit 1
}

is_unprivileged_user_namespace() {
  local inside_uid outside_uid range
  read -r inside_uid outside_uid range < /proc/self/uid_map || return 1
  [[ "$inside_uid" == 0 && "$outside_uid" =~ ^[1-9][0-9]*$ && "$range" == 1 ]]
}

scenario="${1:-}"
candidate_sha="${2:-}"
rollback_sha="${3:-}"
transaction_id="${4:-}"

if (( $# != 4 )) || [[ ! "$candidate_sha" =~ ^[0-9a-f]{40}$ ]] ||
  [[ ! "$rollback_sha" =~ ^[0-9a-f]{40}$ ]] || [[ "$candidate_sha" == "$rollback_sha" ]] ||
  [[ ! "$transaction_id" =~ ^[a-z0-9][a-z0-9._-]{0,63}$ ]]; then
  fail input
fi
case "$scenario" in positive | health-failure | interruption) ;; *) fail input ;; esac

production_app_root=/srv/botanica-ob
app_root="${REHEARSAL_APP_ROOT:-$production_app_root}"
marker="${REHEARSAL_MARKER:-/run/botanica-ob-node24-rehearsal}"
handoff_script="${REHEARSAL_HANDOFF_SCRIPT:-$app_root/ops/scripts/handoff-release.sh}"
wait_attempts="${REHEARSAL_WAIT_ATTEMPTS:-100}"
pid1="${REHEARSAL_PID1:-$(cat /proc/1/comm 2>/dev/null || true)}"
virtualization="${REHEARSAL_VIRTUALIZATION:-$(systemd-detect-virt --vm 2>/dev/null || true)}"

if [[ -n ${REHEARSAL_APP_ROOT:-}${REHEARSAL_CALLS:-}${REHEARSAL_CHILD_LOG:-}${REHEARSAL_MARKER:-}${REHEARSAL_HANDOFF_SCRIPT:-}${REHEARSAL_PID1:-}${REHEARSAL_TEST_BIN:-}${REHEARSAL_VIRTUALIZATION:-}${REHEARSAL_WAIT_ATTEMPTS:-} ]] &&
  ! is_unprivileged_user_namespace; then
  fail environment
fi
if [[ -n ${REHEARSAL_TEST_BIN:-} ]]; then
  PATH="$REHEARSAL_TEST_BIN:/usr/bin:/bin"
else
  PATH=/usr/bin:/bin
fi
export PATH

case "$virtualization" in '' | none | wsl | docker | podman | lxc | container) fail environment ;; esac
[[ "$pid1" == systemd ]] || fail environment
[[ "$(id -u)" == 0 ]] || fail environment
[[ -f "$marker" && ! -L "$marker" ]] || fail environment
[[ "$(cat "$marker" 2>/dev/null)" == "$transaction_id" ]] || fail environment
[[ "$(stat -c '%U %a' "$marker" 2>/dev/null)" == 'root 400' ]] || fail environment
[[ -d "$app_root" && "$(realpath -- "$app_root" 2>/dev/null)" == "$app_root" ]] || fail target
[[ "$wait_attempts" =~ ^[1-9][0-9]?$|^100$ ]] || fail environment
trusted_path() {
  local path="$1" owner mode
  read -r owner mode < <(stat -c '%U %a' "$path" 2>/dev/null) || return 1
  [[ ! -L "$path" && "$owner" == root && "$mode" =~ ^[0-7][0145][0145]$ ]]
}
for trusted_directory in "$app_root" "$app_root/ops" "$app_root/ops/scripts"; do
  # shellcheck disable=SC2015
  [[ -d "$trusted_directory" ]] && trusted_path "$trusted_directory" || fail baseline
done
activation_script="$app_root/ops/scripts/activate-pm2-release.sh"
if [[ -z ${REHEARSAL_HANDOFF_SCRIPT:-} ]]; then
  # shellcheck disable=SC2015
  [[ -x "$handoff_script" ]] && trusted_path "$handoff_script" || fail baseline
fi

rollback_dir="$app_root/releases/$rollback_sha"
candidate_dir="$app_root/releases/$candidate_sha"
current_link="$app_root/current"
runtime_config="$app_root/config/node24-runtime.conf"
[[ -d "$rollback_dir" && "$(realpath -- "$rollback_dir" 2>/dev/null)" == "$rollback_dir" ]] || fail baseline
[[ "$(realpath -- "$current_link" 2>/dev/null)" == "$rollback_dir" ]] || fail baseline
[[ -f "$runtime_config" && ! -L "$runtime_config" ]] || fail baseline
[[ ! -e "$candidate_dir" ]] || fail target

runtime_value() {
  local key="$1" lines
  lines="$(grep -E "^${key}=" "$runtime_config" 2>/dev/null)" || return 1
  [[ "$(printf '%s\n' "$lines" | wc -l)" == 1 ]] || return 1
  printf '%s\n' "${lines#*=}"
}
node24_version="$(runtime_value NODE24_VERSION)" || fail baseline
node20_version="$(runtime_value NODE20_VERSION)" || fail baseline
node24_pm2_version="$(runtime_value NODE24_PM2_VERSION)" || fail baseline
node20_pm2_version="$(runtime_value NODE20_PM2_VERSION)" || fail baseline
[[ "$node24_version" =~ ^v24\.[0-9]+\.[0-9]+$ && "$node20_version" =~ ^v20\.[0-9]+\.[0-9]+$ ]] || fail baseline
[[ "$node24_pm2_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ && "$node20_pm2_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail baseline

health_status() {
  curl --fail --silent --show-error --max-time 5 --output /dev/null --write-out '%{http_code}' http://127.0.0.1:3000/api/health
}
[[ "$(health_status 2>/dev/null)" == 200 ]] || fail baseline

owner="$(stat -c %U "$rollback_dir")" || fail baseline
group="$(stat -c %G "$rollback_dir")" || fail baseline
install -d -o "$owner" -g "$group" -m 750 "$candidate_dir" || fail preparation
child_log="${REHEARSAL_CHILD_LOG:-$(mktemp)}"
export REHEARSAL_APP_ROOT="$app_root" REHEARSAL_CALLS="${REHEARSAL_CALLS:-}" REHEARSAL_SCENARIO="$scenario"
if ! RELEASE_SHA="$candidate_sha" REMOTE_HOST="$owner@localhost" REMOTE_APP_ROOT="$app_root" \
  EXPECTED_RELEASE_OWNER="$owner" EXPECTED_RELEASE_GROUP="$group" EXPECTED_RELEASE_MODE=750 \
  /bin/sh "$handoff_script" >"$child_log" 2>&1; then
  fail preparation
fi
candidate_activation="$candidate_dir/ops/scripts/activate-pm2-release.sh"
[[ -x "$candidate_activation" ]] || fail preparation
# shellcheck disable=SC2015
[[ -x "$activation_script" ]] && trusted_path "$activation_script" || fail preparation

link_matches() {
  [[ "$(realpath -- "$current_link" 2>/dev/null)" == "$1" ]]
}
wait_for_link() {
  local expected="$1" process="$2" _attempt
  for (( _attempt = 0; _attempt < wait_attempts; _attempt++ )); do
    link_matches "$expected" && return 0
    kill -0 "$process" 2>/dev/null || return 1
    sleep 0.1
  done
  return 1
}
kill_candidate_processes() {
  local activation_pid="$1" process pid cwd
  while kill -0 "$activation_pid" 2>/dev/null && link_matches "$candidate_dir"; do
    for process in /proc/[0-9]*; do
      pid="${process##*/}"
      [[ "$pid" != "$$" && "$pid" != "$activation_pid" ]] || continue
      cwd="$(readlink -f "$process/cwd" 2>/dev/null)" || continue
      [[ "$cwd" == "$candidate_dir" ]] && kill -KILL "$pid" 2>/dev/null || true
    done
    sleep 0.1
  done
}

started_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
activation_result=passed
rollback_result=not-required
if [[ "$scenario" == positive ]]; then
  /bin/bash "$activation_script" "$candidate_sha" "$rollback_sha" >"$child_log" 2>&1 || fail activation
  link_matches "$candidate_dir" || fail verification
else
  setsid /bin/bash "$activation_script" "$candidate_sha" "$rollback_sha" >"$child_log" 2>&1 &
  activation_pid=$!
  wait_for_link "$candidate_dir" "$activation_pid" || fail activation
  if [[ "$scenario" == health-failure ]]; then
    kill_candidate_processes "$activation_pid" &
    fault_pid=$!
  else
    kill -TERM -- "-$activation_pid" 2>/dev/null || fail interruption
  fi
  if wait "$activation_pid"; then activation_status=0; else activation_status=$?; fi
  activation_pid=""
  [[ "$activation_status" != 0 ]] || fail activation
  if [[ -n "$fault_pid" ]]; then wait "$fault_pid"; fault_pid=""; fi
  grep -Fx 'activation=failed; rollback=passed' "$child_log" >/dev/null 2>&1 || fail recovery
  link_matches "$rollback_dir" || fail recovery
  activation_result=failed-as-planned
  rollback_result=passed
fi
final_health="$(health_status 2>/dev/null)"
[[ "$final_health" == 200 ]] || fail verification
finished_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
printf 'rehearsal=passed transaction=%s scenario=%s candidate=%s rollback=%s node24_version=%s node20_version=%s node24_pm2_version=%s node20_pm2_version=%s started_at=%s finished_at=%s preparation=passed activation=%s final_executable_identity=true final_cwd_identity=true health=%s rollback_result=%s\n' \
  "$transaction_id" "$scenario" "$candidate_sha" "$rollback_sha" "$node24_version" "$node20_version" \
  "$node24_pm2_version" "$node20_pm2_version" "$started_at" "$finished_at" "$activation_result" "$final_health" "$rollback_result" >&2
