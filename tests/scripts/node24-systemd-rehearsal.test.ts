import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/node24-systemd-rehearsal.sh');
const candidateSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const rollbackSha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const transactionId = 'gha-123-1';
const temporaryDirectories: string[] = [];

function temporaryDirectory() {
  const directory = mkdtempSync(join(tmpdir(), 'botanica-systemd-rehearsal-'));
  temporaryDirectories.push(directory);
  return directory;
}

function executable(path: string, source: string) {
  writeFileSync(path, `#!/usr/bin/env bash\n${source}`);
  chmodSync(path, 0o755);
}

function run(scenario: 'positive' | 'health-failure' | 'interruption', overrides: Record<string, string> = {}) {
  const root = temporaryDirectory();
  const appRoot = join(root, 'app');
  const rollbackDir = join(appRoot, 'releases', rollbackSha);
  const marker = join(root, 'disposable.marker');
  const calls = join(root, 'calls');
  const childLog = join(root, 'child-log');
  const fakeBin = join(root, 'bin');
  const handoff = join(root, 'handoff-release.sh');

  mkdirSync(join(rollbackDir, 'ops', 'pm2'), { recursive: true });
  mkdirSync(join(appRoot, 'config'), { recursive: true });
  mkdirSync(join(appRoot, 'ops', 'scripts'), { recursive: true });
  mkdirSync(fakeBin);
  writeFileSync(join(rollbackDir, 'ops', 'pm2', 'ecosystem.config.cjs'), 'module.exports = {};\n');
  chmodSync(rollbackDir, 0o555);
  chmodSync(join(rollbackDir, 'ops'), 0o555);
  chmodSync(join(rollbackDir, 'ops', 'pm2'), 0o555);
  symlinkSync(rollbackDir, join(appRoot, 'current'));
  writeFileSync(marker, `${transactionId}\n`);
  chmodSync(marker, 0o400);
  writeFileSync(join(appRoot, 'config', 'node24-runtime.conf'), [
    'NODE24_BIN=/opt/node24/bin/node',
    'NODE24_VERSION=v24.20.0',
    'NODE24_NPM_CLI=/opt/node24/lib/node_modules/npm/bin/npm-cli.js',
    'NODE24_NPM_VERSION=11.11.0',
    'NODE20_BIN=/opt/node20/bin/node',
    'NODE20_VERSION=v20.20.0',
    'NODE20_PM2_CLI=/opt/pm2/node_modules/pm2/lib/binaries/CLI.js',
    'NODE20_PM2_VERSION=5.4.3',
    'NODE24_PM2_CLI=/opt/pm2/node_modules/pm2/lib/binaries/CLI.js',
    'NODE24_PM2_VERSION=5.4.3',
    'PM2_RUN_AS=botanica-rehearsal',
    'PM2_HOME=/srv/botanica-ob/.pm2',
    '',
  ].join('\n'));

  executable(join(fakeBin, 'curl'), "printf '200'");
  executable(join(fakeBin, 'git'), 'exit 0');
  executable(join(fakeBin, 'systemd-detect-virt'), "printf 'microsoft\\n'");
  executable(handoff, `
    printf 'handoff:%s\\n' "$RELEASE_SHA" >> "$REHEARSAL_CALLS"
    release="$REMOTE_APP_ROOT/releases/$RELEASE_SHA"
    trusted="$REMOTE_APP_ROOT/ops/scripts/activate-pm2-release.sh"
    mkdir -p "$release/ops/scripts"
    printf '#!/usr/bin/env bash\\nexit 99\\n' > "$release/ops/scripts/activate-pm2-release.sh"
    cat > "$trusted" <<'SCRIPT'
#!/usr/bin/env bash
set -u
candidate="$1"
rollback="$2"
candidate_dir="$REHEARSAL_APP_ROOT/releases/$candidate"
rollback_dir="$REHEARSAL_APP_ROOT/releases/$rollback"
printf 'activate:%s:%s:%s\\n' "$REHEARSAL_SCENARIO" "$candidate" "$rollback" >> "$REHEARSAL_CALLS"
if [[ \${FAKE_ACTIVATION_MODE:-} == require-runuser-path && "$PATH" != "$REHEARSAL_TEST_BIN:/usr/sbin:/usr/bin:/bin" ]]; then exit 1; fi
if [[ \${FAKE_ACTIVATION_MODE:-} == slow ]]; then trap 'printf "terminated\\n" >> "$REHEARSAL_CALLS"; exit 143' TERM; sleep 30; fi
restore() { ln -sfnT "$rollback_dir" "$REHEARSAL_APP_ROOT/current"; printf 'activation=failed; rollback=passed\\n' >&2; }
ln -sfnT "$candidate_dir" "$REHEARSAL_APP_ROOT/current"
case "$REHEARSAL_SCENARIO" in
  positive) exit 0 ;;
  health-failure)
    trap restore EXIT
    (cd "$candidate_dir" && sleep 30) &
    wait $!
    exit 1
    ;;
  interruption)
    trap 'restore; exit 143' TERM INT
    trap restore EXIT
    while :; do sleep 1; done
    ;;
esac
SCRIPT
    chmod 555 "$trusted" "$release/ops/scripts/activate-pm2-release.sh"
    chmod -R a-w "$release"
  `);

  const result = spawnSync('/usr/bin/unshare', ['-Ur', '/bin/bash', scriptPath, scenario, candidateSha, rollbackSha, transactionId], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:/usr/bin:/bin`,
      REHEARSAL_APP_ROOT: appRoot,
      REHEARSAL_CALLS: calls,
      REHEARSAL_CHILD_LOG: childLog,
      REHEARSAL_HANDOFF_SCRIPT: handoff,
      REHEARSAL_MARKER: marker,
      REHEARSAL_PID1: 'systemd',
      REHEARSAL_TEST_BIN: fakeBin,
      REHEARSAL_VIRTUALIZATION: 'microsoft',
      SECRET_SENTINEL: 'must-not-appear',
      ...overrides,
    },
  });

  return {
    appRoot,
    calls: existsSync(calls) ? readFileSync(calls, 'utf8').trim().split('\n').filter(Boolean) : [],
    result,
  };
}

afterEach(() => temporaryDirectories.splice(0).forEach((directory) => {
  spawnSync('/bin/chmod', ['-R', 'u+w', directory]);
  rmSync(directory, { recursive: true, force: true });
}));

describe('disposable Node 24 systemd rehearsal', () => {
  it.each(['positive', 'health-failure', 'interruption'] as const)('executes the real ordered boundary for %s', (scenario) => {
    const attempt = run(scenario);

    expect(attempt.result.status, attempt.result.stderr).toBe(0);
    expect(attempt.calls).toEqual([
      `handoff:${candidateSha}`,
      `activate:${scenario}:${candidateSha}:${rollbackSha}`,
    ]);
    expect(attempt.result.stderr).not.toContain('must-not-appear');
    expect(attempt.result.stderr).toContain(`rehearsal=passed transaction=${transactionId} scenario=${scenario}`);
    expect(attempt.result.stderr).toContain('final_executable_identity=true final_cwd_identity=true');
    expect(readlinkSync(join(attempt.appRoot, 'current'))).toBe(
      scenario === 'positive'
        ? join(attempt.appRoot, 'releases', candidateSha)
        : join(attempt.appRoot, 'releases', rollbackSha),
    );
  });

  it.each([
    ['malformed candidate', 'bad', rollbackSha],
    ['uppercase candidate', 'A'.repeat(40), rollbackSha],
    ['matching releases', rollbackSha, rollbackSha],
  ])('rejects %s before handoff', (_case, candidate, rollback) => {
    const result = spawnSync('/usr/bin/unshare', ['-Ur', '/bin/bash', scriptPath, 'positive', candidate, rollback, transactionId], {
      encoding: 'utf8',
      env: { ...process.env, REHEARSAL_PID1: 'systemd', REHEARSAL_VIRTUALIZATION: 'microsoft' },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('stage=input');
    expect(result.stderr).not.toContain('rm:');
  });

  it('rejects test overrides outside an unprivileged user namespace', () => {
    const result = spawnSync('/bin/bash', [scriptPath, 'positive', candidateSha, rollbackSha, transactionId], {
      encoding: 'utf8',
      env: { ...process.env, REHEARSAL_APP_ROOT: temporaryDirectory() },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toBe('rehearsal=failed stage=environment\n');
  });

  it('provides the system runuser directory to activation', () => {
    const attempt = run('positive', { FAKE_ACTIVATION_MODE: 'require-runuser-path' });

    expect(attempt.result.status, attempt.result.stderr).toBe(0);
  });

  it('terminates and reaps an activation that never switches the release link', () => {
    const attempt = run('health-failure', { FAKE_ACTIVATION_MODE: 'slow', REHEARSAL_WAIT_ATTEMPTS: '2' });

    expect(attempt.result.status).not.toBe(0);
    expect(attempt.result.stderr).toBe('rehearsal=failed stage=activation\n');
    expect(attempt.calls.at(-1)).toBe('terminated');
  });

  it('rejects a non-systemd or WSL environment before handoff', () => {
    const attempt = run('positive', { REHEARSAL_PID1: 'init', REHEARSAL_VIRTUALIZATION: 'wsl' });

    expect(attempt.result.status).not.toBe(0);
    expect(attempt.result.stderr).toContain('stage=environment');
    expect(attempt.calls).toEqual([]);
  });
});
