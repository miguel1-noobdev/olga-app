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
  printf 'handoff=%s release=%s timestamp=%s stage=%s status=%s identity=%s metadata=%s\n' \
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

remote_host=${REMOTE_HOST-}
remote_app_root=${REMOTE_APP_ROOT-}
expected_owner=${EXPECTED_RELEASE_OWNER-}
expected_group=${EXPECTED_RELEASE_GROUP-}
expected_mode=${EXPECTED_RELEASE_MODE-750}

if [ "${#release}" -ne 40 ] || [ -z "$remote_host" ] || [ -z "$remote_app_root" ] || [ -z "$expected_owner" ] || [ -z "$expected_group" ]; then
  fail input 1
fi
case "$release" in *[!0123456789abcdef]*) fail input 1 ;; esac

release_dir="$remote_app_root/releases/$release"
if preflight=$(ssh "$remote_host" "id -un; id -gn; stat -c '%U:%G %a' '$release_dir'"); then :; else fail preflight $?; fi
identity=$(printf '%s\n' "$preflight" | sed -n '1p')
group=$(printf '%s\n' "$preflight" | sed -n '2p')
metadata=$(printf '%s\n' "$preflight" | sed -n '3p')

if [ "$identity" != "$expected_owner" ] || [ "$group" != "$expected_group" ] || [ "$metadata" != "$expected_owner:$expected_group $expected_mode" ]; then
  fail preflight 1
fi

stage=preflight
if [ "${HANDOFF_RECEIPT_ONLY-}" = 1 ]; then exit 0; fi

if git archive --worktree-attributes --format=tar "$release" | ssh "$remote_host" "RELEASE_SHA='$release' /bin/sh '$release_dir/ops/scripts/prepare-release.sh'"; then :; else fail transfer $?; fi
stage=transferred
exit 0
