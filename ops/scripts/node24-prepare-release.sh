#!/bin/sh
set -u

release=invalid
stage=init
identity=unknown
metadata=unknown
source_file=

cleanup() {
  if [ -n "$source_file" ]; then /usr/bin/rm -f -- "$source_file" || :; source_file=; fi
}
emit() {
  status=$1
  timestamp=$(/usr/bin/date -u '+%Y-%m-%dT%H:%M:%SZ') || timestamp=1970-01-01T00:00:00Z
  if [ "$status" -eq 0 ]; then outcome=passed; else outcome=failed; fi
  printf 'preparation=%s release=%s timestamp=%s stage=%s status=%s identity=%s metadata=%s\n' \
    "$outcome" "$release" "$timestamp" "$stage" "$status" "$identity" "$metadata" >&2
}
finish() { status=$1; trap - 0; cleanup; emit "$status"; exit "$status"; }
fail() { stage=$1; finish "$2"; }
trap 'finish $?' 0

raw_release=${RELEASE_SHA-}
app_root=${APP_ROOT-}
expected_owner=${EXPECTED_RELEASE_OWNER-}
expected_group=${EXPECTED_RELEASE_GROUP-}
expected_mode=${EXPECTED_RELEASE_MODE-750}
verified_node=${VERIFIED_NODE-}
verified_npm_cli=${VERIFIED_NPM_CLI-}
verified_source_digest=${VERIFIED_SOURCE_DIGEST-}
activation_digest=53cc6b9c9122407474c5cd6cbe2e4342a03bbff7a2d952799863a8d7f102e049

if [ "${#raw_release}" -ne 40 ]; then fail input 1; fi
case "$raw_release" in *[!0123456789abcdef]*) fail input 1 ;; esac
if [ "${#verified_source_digest}" -ne 64 ]; then fail input 1; fi
case "$verified_source_digest" in *[!0123456789abcdef]*) fail input 1 ;; esac
release=$raw_release
case "$verified_node" in /*) ;; *) fail input 1 ;; esac
case "$verified_npm_cli" in /*) ;; *) fail input 1 ;; esac
node_dir=${verified_node%/*}
if [ -z "$node_dir" ] || [ "$node_dir" = / ] || [ ! -x "$verified_node" ] || [ ! -f "$verified_npm_cli" ] || [ ! -r "$verified_npm_cli" ]; then fail input 1; fi
if [ -z "$app_root" ] || [ -z "$expected_owner" ] || [ -z "$expected_group" ]; then fail input 1; fi
PATH=$node_dir:/usr/bin:/bin
export PATH

release_dir=$app_root/releases/$release
activation_script=$release_dir/ops/scripts/activate-pm2-release.sh
export RELEASE_DIR=$release_dir RELEASE_SHA=$release
if identity=$(/usr/bin/id -un); then :; else fail id $?; fi
if [ "$identity" != "$expected_owner" ]; then fail owner 1; fi
if [ ! -d "$release_dir" ]; then fail missing 1; fi
for entry in "$release_dir"/* "$release_dir"/.[!.]* "$release_dir"/..?*; do
  if [ -e "$entry" ] || [ -L "$entry" ]; then fail not_empty 1; fi
done
if metadata=$(/usr/bin/stat -c '%U:%G %a' "$release_dir"); then :; else fail stat $?; fi
target_owner=${metadata%%:*}
target_group_mode=${metadata#*:}
target_group=${target_group_mode% *}
target_mode=${metadata##* }
if [ "$target_owner" != "$expected_owner" ]; then fail owner 1; fi
if [ "$target_group" != "$expected_group" ]; then fail group 1; fi
if [ "$target_mode" != "$expected_mode" ]; then fail mode 1; fi
if [ ! -w "$release_dir" ]; then fail writable 1; fi
umask 077
source_file=$release_dir/.node24-source
if /usr/bin/dd of="$source_file" bs=65536 conv=fsync; then :; else fail source_capture $?; fi
if source_hash=$(/usr/bin/sha256sum < "$source_file"); then :; else fail source_digest $?; fi
source_hash=${source_hash%% *}
if [ "$source_hash" != "$verified_source_digest" ]; then fail source_digest 1; fi
if /usr/bin/tar -xf "$source_file" -C "$release_dir"; then :; else fail archive_extract $?; fi
if /usr/bin/rm -f -- "$source_file"; then source_file=; else fail cleanup $?; fi
cd "$release_dir" || fail workdir $?
if "$verified_node" "$verified_npm_cli" ci --offline; then :; else fail install $?; fi
if "$verified_node" "$verified_npm_cli" run build --offline; then :; else fail build $?; fi
if [ ! -f "$activation_script" ] || [ -L "$activation_script" ]; then fail activation_identity 1; fi
if activation_hash=$(/usr/bin/sha256sum < "$activation_script"); then :; else fail activation_identity $?; fi
activation_hash=${activation_hash%% *}
if [ "$activation_hash" != "$activation_digest" ]; then fail activation_identity 1; fi
if /usr/bin/chmod -R a-w "$release_dir"; then :; else fail seal $?; fi
stage=sealed
exit 0
