#!/bin/sh
set -u

release=${RELEASE_SHA-unknown}
stage=init
identity=unknown
metadata=unknown

emit() {
  status=$1
  timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ') || timestamp=1970-01-01T00:00:00Z
  if [ "$status" -eq 0 ]; then outcome=passed; else outcome=failed; fi
  printf 'preparation=%s release=%s timestamp=%s stage=%s status=%s identity=%s metadata=%s\n' \
    "$outcome" "$release" "$timestamp" "$stage" "$status" "$identity" "$metadata" >&2
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

app_root=${APP_ROOT-}
expected_owner=${EXPECTED_RELEASE_OWNER-}
expected_group=${EXPECTED_RELEASE_GROUP-}
expected_mode=${EXPECTED_RELEASE_MODE-750}

if [ "${#release}" -ne 40 ] || [ -z "$app_root" ] || [ -z "$expected_owner" ] || [ -z "$expected_group" ]; then
  fail input 1
fi
case "$release" in *[!0123456789abcdef]*) fail input 1 ;; esac

release_dir="$app_root/releases/$release"
activation_script="$release_dir/ops/scripts/activate-pm2-release.sh"
export RELEASE_DIR="$release_dir" RELEASE_SHA="$release"

if identity=$(id -un); then :; else fail id $?; fi
if [ "$identity" != "$expected_owner" ]; then fail owner 1; fi
if [ ! -d "$release_dir" ]; then fail missing 1; fi
for entry in "$release_dir"/* "$release_dir"/.[!.]* "$release_dir"/..?*; do
  if [ -e "$entry" ] || [ -L "$entry" ]; then fail not_empty 1; fi
done
if metadata=$(stat -c '%U:%G %a' "$release_dir"); then :; else fail stat $?; fi
target_owner=${metadata%%:*}
target_group_mode=${metadata#*:}
target_group=${target_group_mode% *}
target_mode=${metadata##* }
if [ "$target_owner" != "$expected_owner" ]; then fail owner 1; fi
if [ "$target_group" != "$expected_group" ]; then fail group 1; fi
if [ "$target_mode" != "$expected_mode" ]; then fail mode 1; fi
if [ ! -w "$release_dir" ]; then fail writable 1; fi

if tar -xf - -C "$release_dir"; then :; else fail archive_extract $?; fi
cd "$release_dir" || fail workdir $?
if npm ci; then :; else fail install $?; fi
if npm run build; then :; else fail build $?; fi
if grep -F 'readonly RELEASE_ID="${1:-}"' "$activation_script" >/dev/null; then :; else fail activation_identity $?; fi
if chmod -R a-w "$release_dir"; then :; else fail seal $?; fi
stage=sealed
exit 0
