#!/bin/sh
set -u

if [ "${PREPARATION_LIFECYCLE_SHELL+x}" = x ]; then
  lifecycle_node=${PREPARATION_LIFECYCLE_NODE-}
  if [ "${PREPARATION_LIFECYCLE_SHELL-}" != 1 ] || [ "$#" -ne 2 ] || [ "$1" != -c ] ||
    [ -z "$lifecycle_node" ] || [ "${npm_node_execpath-}" != "$lifecycle_node" ] || [ -z "${PATH-}" ]; then exit 1; fi
  case "$lifecycle_node" in /*/*) ;; *) exit 1 ;; esac
  PATH="${lifecycle_node%/*}:$PATH"
  export PATH
  exec /bin/sh "$@"
fi

PATH=/usr/bin:/bin
export PATH
release=${RELEASE_SHA-}
stage=init
receipt_node_version=unverified
receipt_npm_version=unverified

emit() {
  status=$1
  timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null) || timestamp=1970-01-01T00:00:00Z
  if [ "$status" -eq 0 ]; then outcome=passed; else outcome=failed; fi
  printf 'preparation=%s release=%s timestamp=%s stage=%s status=%s node_version=%s npm_version=%s\n' \
    "$outcome" "$release" "$timestamp" "$stage" "$status" "$receipt_node_version" "$receipt_npm_version" >&2
}

finish() {
  status=$1
  emit "$status"
  trap - 0
  exit "$status"
}

fail() {
  stage=$1
  finish "$2"
}

trap 'finish $?' 0

mode_permissions() {
  case "$1" in
    [0-7][0-7][0-7]) permissions=$1 ;;
    [0-7][0-7][0-7][0-7]) permissions=${1#?} ;;
    *) return 1 ;;
  esac
}

app_root=${APP_ROOT-}
expected_owner=${EXPECTED_RELEASE_OWNER-}
expected_group=${EXPECTED_RELEASE_GROUP-}
expected_mode=${EXPECTED_RELEASE_MODE-750}
runtime_config="$app_root/config/node24-runtime.conf"

if [ "${#release}" -ne 40 ] || [ -z "$app_root" ] || [ -z "$expected_owner" ] || [ -z "$expected_group" ]; then
  release=unverified
  fail input 1
fi
case "$release" in *[!0123456789abcdef]*) release=unverified; fail input 1 ;; esac

release_dir="$app_root/releases/$release"
activation_script="$release_dir/ops/scripts/activate-pm2-release.sh"
export RELEASE_DIR="$release_dir" RELEASE_SHA="$release"

if identity=$(id -un 2>/dev/null); then :; else fail id $?; fi
if [ "$identity" != "$expected_owner" ]; then fail owner 1; fi
if [ ! -d "$release_dir" ]; then fail missing 1; fi
for entry in "$release_dir"/* "$release_dir"/.[!.]* "$release_dir"/..?*; do
  if [ -e "$entry" ] || [ -L "$entry" ]; then fail not_empty 1; fi
done
if metadata=$(stat -c '%U:%G %a' "$release_dir" 2>/dev/null); then :; else fail stat $?; fi
target_owner=${metadata%%:*}
target_group_mode=${metadata#*:}
target_group=${target_group_mode% *}
target_mode=${metadata##* }
if [ "$target_owner" != "$expected_owner" ]; then fail owner 1; fi
if [ "$target_group" != "$expected_group" ]; then fail group 1; fi
if [ "$target_mode" != "$expected_mode" ]; then fail mode 1; fi
if [ ! -w "$release_dir" ]; then fail writable 1; fi

if [ ! -f "$runtime_config" ] || [ -L "$runtime_config" ] || [ ! -r "$runtime_config" ]; then
  fail runtime_config 1
fi
if config_metadata=$(stat -c '%U %a' "$runtime_config" 2>/dev/null); then :; else fail runtime_config_metadata $?; fi
config_owner=${config_metadata%% *}
config_mode=${config_metadata##* }
if ! mode_permissions "$config_mode"; then fail runtime_config_metadata 1; fi
case "${permissions#?}" in *[2367]*) fail runtime_config_metadata 1 ;; esac
if [ "$config_owner" != root ]; then fail runtime_config_metadata 1; fi
{
  IFS= read -r node_line &&
  IFS= read -r node_version_line &&
  IFS= read -r node24_npm_line &&
  IFS= read -r node24_npm_version_line &&
  IFS= read -r node20_bin_line &&
  IFS= read -r node20_version_line &&
  IFS= read -r node20_pm2_line &&
  IFS= read -r node20_pm2_version_line &&
  IFS= read -r node24_pm2_line &&
  IFS= read -r node24_pm2_version_line &&
  IFS= read -r pm2_run_as_line &&
  IFS= read -r pm2_home_line &&
  ! IFS= read -r _extra_line
} < "$runtime_config" || fail runtime_config_shape 1
case "$node_line" in NODE24_BIN=*) node24_bin=${node_line#NODE24_BIN=} ;; *) fail runtime_config_shape 1 ;; esac
case "$node_version_line" in NODE24_VERSION=*) configured_node_version=${node_version_line#NODE24_VERSION=} ;; *) fail runtime_config_shape 1 ;; esac
case "$node24_npm_line" in NODE24_NPM_CLI=*) node24_npm_cli=${node24_npm_line#NODE24_NPM_CLI=} ;; *) fail runtime_config_shape 1 ;; esac
case "$node24_npm_version_line" in NODE24_NPM_VERSION=*) configured_node24_npm_version=${node24_npm_version_line#NODE24_NPM_VERSION=} ;; *) fail runtime_config_shape 1 ;; esac
case "$node20_bin_line" in NODE20_BIN=*) ;; *) fail runtime_config_shape 1 ;; esac
case "$node20_version_line" in NODE20_VERSION=*) ;; *) fail runtime_config_shape 1 ;; esac
case "$node20_pm2_line" in NODE20_PM2_CLI=*) ;; *) fail runtime_config_shape 1 ;; esac
case "$node20_pm2_version_line" in NODE20_PM2_VERSION=*) ;; *) fail runtime_config_shape 1 ;; esac
case "$node24_pm2_line" in NODE24_PM2_CLI=*) ;; *) fail runtime_config_shape 1 ;; esac
case "$node24_pm2_version_line" in NODE24_PM2_VERSION=*) ;; *) fail runtime_config_shape 1 ;; esac
case "$pm2_run_as_line" in PM2_RUN_AS=*) ;; *) fail runtime_config_shape 1 ;; esac
case "$pm2_home_line" in PM2_HOME=*) ;; *) fail runtime_config_shape 1 ;; esac
case "$node24_bin:$node24_npm_cli" in /*:/*) ;; *) fail runtime_path 1 ;; esac
if [ ! -f "$node24_bin" ] || [ -L "$node24_bin" ] || [ ! -r "$node24_bin" ] || [ ! -x "$node24_bin" ]; then
  fail runtime_node 1
fi
if [ ! -f "$node24_npm_cli" ] || [ -L "$node24_npm_cli" ] || [ ! -r "$node24_npm_cli" ]; then fail runtime_npm 1; fi
if canonical_node=$(realpath -- "$node24_bin" 2>/dev/null); then :; else fail runtime_path 1; fi
if canonical_npm=$(realpath -- "$node24_npm_cli" 2>/dev/null); then :; else fail runtime_path 1; fi
if [ "$canonical_node" != "$node24_bin" ] || [ "$canonical_npm" != "$node24_npm_cli" ]; then fail runtime_path 1; fi
if node_metadata=$(stat -c '%U %a' "$node24_bin" 2>/dev/null); then :; else fail runtime_node_metadata $?; fi
if npm_metadata=$(stat -c '%U %a' "$node24_npm_cli" 2>/dev/null); then :; else fail runtime_npm_metadata $?; fi
if [ "${node_metadata%% *}" != root ]; then fail runtime_node_metadata 1; fi
if [ "${npm_metadata%% *}" != root ]; then fail runtime_npm_metadata 1; fi
if ! mode_permissions "${node_metadata##* }"; then fail runtime_node_metadata 1; fi
case "$permissions" in *[2367]*) fail runtime_node_metadata 1 ;; esac
if ! mode_permissions "${npm_metadata##* }"; then fail runtime_npm_metadata 1; fi
case "$permissions" in *[2367]*) fail runtime_npm_metadata 1 ;; esac

case "$configured_node_version" in v24.*.*) ;; *) fail runtime_node_version 1 ;; esac
node_tail=${configured_node_version#v24.}
case "$node_tail" in *[!0123456789.]*|.*|*.|*..*|*.*.*) fail runtime_node_version 1 ;; esac
case "$configured_node24_npm_version" in *.*.*) ;; *) fail runtime_npm_version 1 ;; esac
case "$configured_node24_npm_version" in *[!0123456789.]*|.*|*.|*..*|*.*.*.*) fail runtime_npm_version 1 ;; esac

if reported_node_version=$("$node24_bin" --version 2>/dev/null); then :; else fail runtime_node_version $?; fi
if [ "$reported_node_version" != "$configured_node_version" ]; then fail runtime_node_version 1; fi
receipt_node_version=$configured_node_version
if canonical_preparer=$(realpath -- "$0" 2>/dev/null); then :; else fail runtime_path $?; fi
PREPARATION_LIFECYCLE_NODE=$canonical_node
PREPARATION_LIFECYCLE_SHELL=1
npm_config_script_shell=$canonical_preparer
export PATH PREPARATION_LIFECYCLE_NODE PREPARATION_LIFECYCLE_SHELL npm_config_script_shell
if reported_npm_version=$("$node24_bin" "$node24_npm_cli" --version 2>/dev/null); then :; else fail runtime_npm_version $?; fi
if [ "$reported_npm_version" != "$configured_node24_npm_version" ]; then fail runtime_npm_version 1; fi
receipt_npm_version=$configured_node24_npm_version

if tar -xf - -C "$release_dir" >/dev/null 2>&1; then :; else fail archive_extract $?; fi
cd "$release_dir" 2>/dev/null || fail workdir $?
if "$node24_bin" "$node24_npm_cli" ci >/dev/null 2>&1; then :; else fail install $?; fi
if "$node24_bin" "$node24_npm_cli" run build >/dev/null 2>&1; then :; else fail build $?; fi
if grep -F "readonly RELEASE_ID=\"\${1:-}\"" "$activation_script" >/dev/null 2>&1; then :; else fail activation_identity $?; fi
if chmod -R a-w "$release_dir" >/dev/null 2>&1; then :; else fail seal $?; fi
stage=sealed
exit 0
