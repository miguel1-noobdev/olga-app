#!/bin/sh
set -u

release=${RELEASE_SHA-unknown}
stage=init
identity=unknown
metadata=unknown
connection_count=0
effective_root=unverified
transfer=unknown
preparation=unknown
activation=unknown

emit() {
  status=$1
  timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ') || timestamp=1970-01-01T00:00:00Z
  if [ "$status" -eq 0 ]; then outcome=passed; else outcome=failed; fi
  printf 'handoff=%s release=%s timestamp=%s stage=%s status=%s identity=%s metadata=%s connection_count=%s effective_root=%s transfer=%s preparation=%s activation=%s\n' \
    "$outcome" "$release" "$timestamp" "$stage" "$status" "$identity" "$metadata" "$connection_count" "$effective_root" "$transfer" "$preparation" "$activation" >&2
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
expected_mode=${EXPECTED_RELEASE_MODE-}

if [ "${HANDOFF_RECEIPT_ONLY-}" = 1 ]; then
  receipt_endpoint_selector=${RECEIPT_ENDPOINT_SELECTOR-}
  transfer=absent
  preparation=absent
  activation=absent

  if [ -z "$receipt_endpoint_selector" ] || [ -z "$expected_owner" ] || [ -z "$expected_group" ] || [ -z "$expected_mode" ]; then
    fail input 1
  fi

  stage=receipt-preflight
  connection_count=1
  if receipt=$(ssh "$receipt_endpoint_selector" '
    set -eu
    pm2_json=$(pm2 jlist)
    managed_release=$(printf "%s" "$pm2_json" | node -e '"'"'
      const fs = require("fs");
      const releases = [...new Set(JSON.parse(fs.readFileSync(0, "utf8"))
        .map((process) => process.pm2_env && (process.pm2_env.pm_cwd || process.pm2_env.pm_exec_path))
        .map((path) => typeof path === "string" && /^(.*)\/releases\/([0-9a-f]{40})(?:\/|$)/.exec(path))
        .filter(Boolean)
        .map((match) => `${match[1]}\t${match[2]}`))];
      if (releases.length !== 1) process.exit(1);
      process.stdout.write(releases[0]);
    '"'"')
    effective_root=${managed_release%%	*}
    active_release=${managed_release#*	}
    release_dir=$effective_root/releases/$active_release
    printf "active_release=%s\neffective_root=%s\nrelease_dir=%s\nowner=%s\ngroup=%s\nmode=%s\n" \
      "$active_release" "$effective_root" "$release_dir" \
      "$(stat -c "%U" "$release_dir")" "$(stat -c "%G" "$release_dir")" "$(stat -c "%a" "$release_dir")"
  ' 2>/dev/null); then :; else fail receipt-preflight $?; fi

  receipt_value() {
    key=$1
    count=$(printf '%s\n' "$receipt" | grep -c "^$key=")
    [ "$count" -eq 1 ] || return 1
    printf '%s\n' "$receipt" | sed -n "s/^$key=//p"
  }

  if [ "$(printf '%s\n' "$receipt" | sed '/^$/d' | wc -l)" -ne 6 ] || printf '%s\n' "$receipt" | grep -qvE '^(active_release|effective_root|release_dir|owner|group|mode)='; then
    fail receipt-preflight 1
  fi
  active_release=$(receipt_value active_release) || fail receipt-preflight 1
  derived_root=$(receipt_value effective_root) || fail receipt-preflight 1
  release_dir=$(receipt_value release_dir) || fail receipt-preflight 1
  remote_owner=$(receipt_value owner) || fail receipt-preflight 1
  remote_group=$(receipt_value group) || fail receipt-preflight 1
  remote_mode=$(receipt_value mode) || fail receipt-preflight 1

  if [ "${#active_release}" -ne 40 ]; then fail receipt-preflight 1; fi
  case "$active_release" in *[!0123456789abcdef]*) fail receipt-preflight 1 ;; esac
  case "$derived_root" in /*) ;; *) fail receipt-preflight 1 ;; esac

  release=$active_release
  effective_root=derived
  if [ "$release_dir" != "$derived_root/releases/$active_release" ]; then
    identity=failed
    fail receipt-preflight 1
  fi
  identity=matched
  if [ "$remote_owner" != "$expected_owner" ] || [ "$remote_group" != "$expected_group" ] || [ "$remote_mode" != "$expected_mode" ]; then
    metadata=failed
    fail receipt-preflight 1
  fi
  metadata=matched
  exit 0
fi

expected_mode=${EXPECTED_RELEASE_MODE-750}
if [ "${#release}" -ne 40 ] || [ -z "$remote_host" ] || [ -z "$remote_app_root" ] || [ -z "$expected_owner" ] || [ -z "$expected_group" ]; then
  fail input 1
fi
case "$release" in *[!0123456789abcdef]*) fail input 1 ;; esac

release_dir="$remote_app_root/releases/$release"
connection_count=1
if preflight=$(ssh "$remote_host" "id -un; id -gn; stat -c '%U:%G %a' '$release_dir'"); then :; else fail preflight $?; fi
identity=$(printf '%s\n' "$preflight" | sed -n '1p')
group=$(printf '%s\n' "$preflight" | sed -n '2p')
metadata=$(printf '%s\n' "$preflight" | sed -n '3p')

if [ "$identity" != "$expected_owner" ] || [ "$group" != "$expected_group" ] || [ "$metadata" != "$expected_owner:$expected_group $expected_mode" ]; then
  fail preflight 1
fi

stage=preflight

if git archive --worktree-attributes --format=tar "$release" | ssh "$remote_host" "RELEASE_SHA='$release' /bin/sh '$release_dir/ops/scripts/prepare-release.sh'"; then :; else fail transfer $?; fi
connection_count=2
stage=transferred
exit 0
