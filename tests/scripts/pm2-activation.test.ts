import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readlinkSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/activate-pm2-release.sh');
const releaseSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const rollbackSha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const temporaryDirectories: string[] = [];

type CandidateOptions = {
  candidateDeleteFails?: boolean;
  candidateStartFails?: boolean;
  currentTarget?: 'candidate' | 'rollback';
  healthTimeout?: string;
  packageSymlink?: boolean;
  node20Path?: string;
  node20Pm2Version?: string;
  node20Version?: string;
  pidDiagnostic?: string;
  pm2Pids?: string;
  pm2Version?: string;
  procCwd?: string;
  procExe?: string;
  rollbackHealthStatus?: string;
  rollbackLinkRestoreFails?: boolean;
  rollbackPids?: string;
  rollbackProcCwd?: string;
  rollbackProcExe?: string;
  rollbackStartFails?: boolean;
};

function command(directory: string, name: string, source: string) {
  writeFileSync(join(directory, name), `#!/bin/sh\n${source}`);
  chmodSync(join(directory, name), 0o755);
}

function run(...arguments_: string[]) {
  return spawnSync('bash', [scriptPath, ...arguments_], { encoding: 'utf8' });
}

function runCandidate(options: CandidateOptions = {}) {
  const root = mkdtempSync(join(tmpdir(), 'botanica-pm2-'));
  const appRoot = join(root, 'app');
  const releaseDir = join(appRoot, 'releases', releaseSha);
  const rollbackDir = join(appRoot, 'releases', rollbackSha);
  const runtime = join(root, 'runtime');
  const poison = join(root, 'poison');
  const bin = join(root, 'bin');
  const config = join(appRoot, 'config', 'node24-runtime.conf');
  const node24 = join(runtime, 'node24');
  const node20 = join(runtime, 'node20');
  const pm2Cli = join(runtime, 'pm2-cli.js');
  const node20Pm2Cli = join(runtime, 'node20-pm2-cli.js');
  const pm2Home = join(root, 'pm2-home');
  const secrets = join(root, 'secrets.env');
  const pm2Calls = join(root, 'pm2-calls');
  const node20Pm2Calls = join(root, 'node20-pm2-calls');
  const poisonCalls = join(root, 'poison-calls');
  const mvCalls = join(root, 'mv-calls');
  const pidCalls = join(root, 'pid-calls');
  const node20PidCalls = join(root, 'node20-pid-calls');
  const runuserCalls = join(root, 'runuser-calls');
  temporaryDirectories.push(root);
  mkdirSync(join(releaseDir, 'ops', 'pm2'), { recursive: true });
  mkdirSync(join(rollbackDir, 'ops', 'pm2'), { recursive: true });
  mkdirSync(join(appRoot, 'config'), { recursive: true });
  mkdirSync(runtime);
  mkdirSync(poison);
  mkdirSync(bin);
  mkdirSync(pm2Home);
  command(runtime, 'node24', `
    if [ "$1" = '--version' ]; then printf '%s\\n' "$NODE_REPORTED_VERSION"; exit 0; fi
    if [ "$1" != "$PM2_CLI" ]; then exit 97; fi
    if [ "$2" = '--version' ]; then printf '%s\\n' "$PM2_REPORTED_VERSION"; exit 0; fi
    printf '%s|%s|%s\\n' "$PM2_NODE_BIN" "$PM2_CWD" "$2" >> "$PM2_CALLS"
    if [ "$2" = delete ] && [ "\${CANDIDATE_DELETE_FAIL-}" = 1 ]; then exit 43; fi
    if [ "$2" = start ] && [ "\${CANDIDATE_START_FAIL-}" = 1 ]; then exit 42; fi
    if [ "$2" = pid ]; then
      if [ -n "\${PID_DIAGNOSTIC-}" ]; then printf '%s\n' "$PID_DIAGNOSTIC" >&2; exit 33; fi
      calls=0; [ ! -f "$PID_CALLS" ] || calls=$(cat "$PID_CALLS")
      calls=$((calls + 1)); printf '%s' "$calls" > "$PID_CALLS"
      printf '%s\\n' "$(printf '%s' "$PM2_PIDS" | cut -d, -f "$calls")"
    fi
  `);
  command(runtime, 'node20', `
    if [ "$1" = '--version' ]; then printf '%s\\n' "$NODE20_REPORTED_VERSION"; exit 0; fi
    if [ "$1" != "$NODE20_PM2_CLI" ]; then exit 97; fi
    if [ "$2" = '--version' ]; then printf '%s\\n' "$NODE20_PM2_REPORTED_VERSION"; exit 0; fi
    printf '%s|%s|%s\\n' "$PM2_NODE_BIN" "$PM2_CWD" "$2" >> "$NODE20_PM2_CALLS"
    if [ "$2" = start ] && [ "\${ROLLBACK_START_FAIL-}" = 1 ]; then exit 86; fi
    if [ "$2" = pid ]; then
      calls=0; [ ! -f "$NODE20_PID_CALLS" ] || calls=$(cat "$NODE20_PID_CALLS")
      calls=$((calls + 1)); printf '%s' "$calls" > "$NODE20_PID_CALLS"
      printf '%s\\n' "$(printf '%s' "$ROLLBACK_PIDS" | cut -d, -f "$calls")"
    fi
  `);
  writeFileSync(node20Pm2Cli, '// Node 20 PM2 CLI fixture\n');
  chmodSync(node20Pm2Cli, 0o444);
  writeFileSync(pm2Cli, '// PM2 CLI fixture\n');
  chmodSync(pm2Cli, 0o444);
  for (const name of ['node', 'pm2']) command(poison, name, `printf 'poison\\n' >> "$POISON_CALLS"; exit 99`);
  command(bin, 'id', `case "$1" in -u) printf '0\\n' ;; candidate) exit 0 ;; *) exec /usr/bin/id "$@" ;; esac`);
  command(bin, 'runuser', `
    printf '%s\\n' "$*" >> "$RUNUSER_CALLS"
    while [ "$1" != '--' ]; do shift; done
    shift
    exec "$@"
  `);
  command(bin, 'mv', `
    printf '%s\\n' "$*" >> "$MV_CALLS"
    for argument in "$@"; do
      case "$argument" in */.current.rollback.*)
        [ "\${ROLLBACK_LINK_RESTORE_FAIL-}" = 1 ] && exit 87 ;;
      esac
    done
    exec /usr/bin/mv "$@"
  `);
  command(bin, 'curl', `printf '%s' "$CURL_STATUS"`);
  command(bin, 'readlink', `
    case "$2" in
      /proc/5252/exe) printf '%s\\n' "$ROLLBACK_PROC_EXE" ;;
      /proc/5252/cwd) printf '%s\\n' "$ROLLBACK_PROC_CWD" ;;
      /proc/*/exe) printf '%s\\n' "$CANDIDATE_PROC_EXE" ;;
      /proc/*/cwd) printf '%s\\n' "$CANDIDATE_PROC_CWD" ;;
      *) exec /usr/bin/readlink "$@" ;;
    esac
  `);
  writeFileSync(config, [
    `NODE24_BIN=${node24}`,
    'NODE24_VERSION=v24.13.1',
    `NODE24_NPM_CLI=${join(runtime, 'npm-cli.js')}`,
    'NODE24_NPM_VERSION=11.10.0',
    `NODE20_BIN=${options.node20Path ?? node20}`,
    'NODE20_VERSION=v20.19.6',
    `NODE20_PM2_CLI=${node20Pm2Cli}`,
    'NODE20_PM2_VERSION=5.4.3',
    `NODE24_PM2_CLI=${pm2Cli}`,
    'NODE24_PM2_VERSION=5.4.3',
    'PM2_RUN_AS=candidate',
    `PM2_HOME=${pm2Home}`,
    '',
  ].join('\n'));
  chmodSync(config, 0o644);
  const ecosystem = join(releaseDir, 'ops', 'pm2', 'ecosystem.config.cjs');
  const rollbackEcosystem = join(rollbackDir, 'ops', 'pm2', 'ecosystem.config.cjs');
  writeFileSync(ecosystem, 'module.exports = {};\n');
  writeFileSync(rollbackEcosystem, 'module.exports = {};\n');
  if (options.packageSymlink) {
    const packageDirectory = join(releaseDir, 'node_modules');
    mkdirSync(packageDirectory);
    symlinkSync('../ops', join(packageDirectory, 'package'));
    chmodSync(packageDirectory, 0o555);
  }
  chmodSync(ecosystem, 0o444);
  chmodSync(rollbackEcosystem, 0o444);
  for (const directory of [releaseDir, rollbackDir]) {
    chmodSync(directory, 0o555);
    chmodSync(join(directory, 'ops'), 0o555);
    chmodSync(join(directory, 'ops', 'pm2'), 0o555);
  }
  symlinkSync(options.currentTarget === 'candidate' ? releaseDir : rollbackDir, join(appRoot, 'current'));
  writeFileSync(secrets, 'MONGODB_URI=mongodb://fixture\nNEXTAUTH_SECRET=test\nNEXTAUTH_URL=http://127.0.0.1:3000\nINTERNAL_ACCOUNT_CHECK_ORIGIN=http://127.0.0.1:3000\n');
  chmodSync(secrets, 0o600);

  const result = spawnSync('/usr/bin/unshare', ['-Ur', '/bin/bash', scriptPath, releaseSha, rollbackSha], {
    encoding: 'utf8',
    env: {
      NODE_ENV: 'test', APP_ROOT: appRoot, NODE24_BIN: join(poison, 'node'), PATH: `${bin}:${poison}:/usr/bin:/bin`,
      CANDIDATE_DELETE_FAIL: options.candidateDeleteFails ? '1' : '', CANDIDATE_START_FAIL: options.candidateStartFails ? '1' : '',
      PM2_CALLS: pm2Calls, PM2_CLI: pm2Cli, PM2_PIDS: options.pm2Pids ?? '4242,4242', PID_DIAGNOSTIC: options.pidDiagnostic ?? '',
      PM2_REPORTED_VERSION: options.pm2Version ?? '5.4.3', NODE_REPORTED_VERSION: 'v24.13.1', NODE20_REPORTED_VERSION: options.node20Version ?? 'v20.19.6',
      NODE20_PM2_CLI: node20Pm2Cli, NODE20_PM2_CALLS: node20Pm2Calls, NODE20_PM2_REPORTED_VERSION: options.node20Pm2Version ?? '5.4.3',
      ROLLBACK_START_FAIL: options.rollbackStartFails ? '1' : '', ROLLBACK_LINK_RESTORE_FAIL: options.rollbackLinkRestoreFails ? '1' : '',
      ROLLBACK_PIDS: options.rollbackPids ?? '5252,5252', PID_CALLS: pidCalls, NODE20_PID_CALLS: node20PidCalls,
      MV_CALLS: mvCalls, POISON_CALLS: poisonCalls, CANDIDATE_PROC_CWD: options.procCwd ?? releaseDir,
      CANDIDATE_PROC_EXE: options.procExe ?? node24, ROLLBACK_PROC_CWD: options.rollbackProcCwd ?? rollbackDir,
      ROLLBACK_PROC_EXE: options.rollbackProcExe ?? node20, RUNUSER_CALLS: runuserCalls,
      SECRETS_FILE: secrets, HEALTH_TIMEOUT_SECONDS: options.healthTimeout ?? (options.rollbackHealthStatus ? '0' : undefined),
      CURL_STATUS: options.rollbackHealthStatus ?? '200',
    },
  });
  for (const directory of [releaseDir, rollbackDir]) {
    chmodSync(directory, 0o755);
    chmodSync(join(directory, 'ops'), 0o755);
    chmodSync(join(directory, 'ops', 'pm2'), 0o755);
  }
  if (options.packageSymlink) chmodSync(join(releaseDir, 'node_modules'), 0o755);
  return {
    currentExists: () => existsSync(join(appRoot, 'current')),
    currentTarget: () => readlinkSync(join(appRoot, 'current')),
    mvCalls: () => existsSync(mvCalls) ? readFileSync(mvCalls, 'utf8').trim().split('\n').filter(Boolean) : [],
    pm2Calls: () => existsSync(pm2Calls) ? readFileSync(pm2Calls, 'utf8').trim().split('\n').filter(Boolean) : [],
    node20Pm2Calls: () => existsSync(node20Pm2Calls) ? readFileSync(node20Pm2Calls, 'utf8').trim().split('\n').filter(Boolean) : [],
    poisonUsed: () => existsSync(poisonCalls),
    result,
    runuserCalls: () => existsSync(runuserCalls) ? readFileSync(runuserCalls, 'utf8') : '',
    node20,
    node24,
    pm2Cli,
    releaseDir,
    rollbackDir,
  };
}

afterEach(() => temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { force: true, recursive: true })));

describe('PM2 release activation script', () => {
  it('is valid executable shell and requires distinct caller-supplied immutable release SHAs', () => {
    const syntax = spawnSync('bash', ['-n', scriptPath], { encoding: 'utf8' });
    const source = readFileSync(scriptPath, 'utf8');

    expect(syntax.status).toBe(0);
    expect(statSync(scriptPath).mode & 0o777).toBe(0o755);
    expect(source).toContain('#!/usr/bin/env bash');
    expect(source).toContain('readonly CANDIDATE_SHA="${1:-}"');
    expect(source).toContain('readonly ROLLBACK_SHA="${2:-}"');
    expect(source).not.toContain('b050790d8dc7ab9638dd74217c18cd770043401f');
    expect(source).toContain('RELEASE_DIR="$APP_ROOT/releases/$CANDIDATE_SHA"');
    expect(source).toContain('ROLLBACK_DIR="$APP_ROOT/releases/$ROLLBACK_SHA"');
    expect(source).toContain('CURRENT_LINK="$APP_ROOT/current"');
    expect(source).toContain('SECRETS_FILE="${SECRETS_FILE:-/etc/botanica-ob/secrets.env}"');

    for (const arguments_ of [[], ['not-a-sha', rollbackSha], [releaseSha], [releaseSha, releaseSha], ['A'.repeat(40), rollbackSha]]) {
      const result = run(...arguments_);

      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toContain('Distinct full 40-character lowercase candidate and rollback Git SHAs are required.');
    }

    const validSha = run(releaseSha, rollbackSha);

    expect(validSha.status, validSha.stderr).toBe(1);
    expect(validSha.stderr).toContain(`Prepared immutable release is unavailable: ${releaseSha}`);
  });

  it('rejects alternate application roots outside an unprivileged user namespace', () => {
    const alternateRoot = join(tmpdir(), 'alternate-release-root');
    const result = spawnSync('bash', [scriptPath, releaseSha, rollbackSha], {
      encoding: 'utf8',
      env: { APP_ROOT: alternateRoot, NODE_ENV: 'test' },
    });

    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain('Application root override requires an unprivileged user namespace.');
    expect(result.stderr).not.toContain(alternateRoot);
  });

  it('sources root-only secrets silently and accepts the established Mongo variable names', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('[[ "$(id -u)" == "0" ]]');
    expect(source).toContain('[[ "$(stat -c \'%u\' "$SECRETS_FILE")" == "0" ]]');
    expect(source).toContain('[[ "$(stat -c \'%a\' "$SECRETS_FILE")" == "600" ]]');
    expect(source).toContain('. "$SECRETS_FILE" >/dev/null 2>&1');

    for (const variable of [
      'MONGO_INITDB_ROOT_USERNAME',
      'MONGO_INITDB_ROOT_PASSWORD',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'INTERNAL_ACCOUNT_CHECK_ORIGIN',
    ]) {
      expect(source).toContain(variable);
    }

    expect(source).toContain('[[ -n ${!required_var:-} ]]');
    expect(source).toContain('MONGODB_URI="mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@127.0.0.1:27017/botanica-ob?authSource=admin"');
    expect(source).not.toMatch(
      /printf[^\n]*(MONGO_INITDB_ROOT_USERNAME|MONGO_INITDB_ROOT_PASSWORD|MONGODB_URI|NEXTAUTH_SECRET|NEXTAUTH_URL|INTERNAL_ACCOUNT_CHECK_ORIGIN)/,
    );
  });

  it('switches current atomically and rolls PM2 and current back on failure', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('trap rollback EXIT');
    expect(source).toContain('ln -s "$RELEASE_DIR" "$current_tmp"');
    expect(source).toContain('mv -Tf "$current_tmp" "$CURRENT_LINK"');
    expect(source).toContain('run_node24_pm2 "$RELEASE_DIR" delete "$PM2_APP"');
    expect(source).toContain('mv -Tf "$restore_tmp" "$CURRENT_LINK"');
    expect(source).toContain('run_node20_pm2 "$ROLLBACK_DIR" start "$ROLLBACK_DIR/ops/pm2/ecosystem.config.cjs"');

  });

  it('runs every candidate PM2 operation through configured Node 24 with a sealed package-style symlink', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('"$NODE24_BIN" "$NODE24_PM2_CLI" "$@"');
    expect(source).not.toContain(' -- pm2 "$@"');
    expect(source).toContain('HEALTH_URL="http://127.0.0.1:3000/api/health"');
    expect(source).toContain('readonly HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-30}"');
    expect(source).toContain('health_deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))');
    expect(source).toContain("die 'Loopback health check failed before readiness deadline.'");

    const attempt = runCandidate({ packageSymlink: true });

    expect(attempt.result.status, attempt.result.stderr).toBe(0);
    expect(attempt.currentTarget()).toBe(attempt.releaseDir);
    expect(attempt.poisonUsed()).toBe(false);
    expect(attempt.pm2Calls().map((call) => call.split('|')[2])).toEqual(['describe', 'delete', 'start', 'pid', 'pid']);
    for (const call of attempt.pm2Calls()) expect(call.split('|').slice(0, 2)).toEqual([attempt.node24, attempt.releaseDir]);
    expect(attempt.runuserCalls()).toContain(`--user candidate -- ${attempt.node24} ${attempt.pm2Cli} describe botanica-ob`);
  });

  it('suppresses configured path diagnostics from failed PM2 PID queries', () => {
    const diagnostic = 'private-node24-pm2-path=/private/configured/node24/pm2';
    const attempt = runCandidate({ pidDiagnostic: diagnostic });

    expect(attempt.result.status, attempt.result.stderr).toBe(33);
    expect(attempt.result.stdout).toBe('');
    expect(attempt.result.stderr).toBe('activation=failed; rollback=passed\n');
    expect(attempt.result.stderr).not.toContain(diagnostic);
  });

  it('rejects PM2 version drift before mutation and rejects unstable or drifted candidate processes', () => {
    const preflight = runCandidate({ pm2Version: '5.4.2' });

    expect(preflight.result.status, preflight.result.stderr).toBe(1);
    expect(preflight.result.stderr).toContain('Node 24 PM2 version drift.');
    expect(preflight.currentExists()).toBe(true);
    expect(preflight.currentTarget()).toBe(preflight.rollbackDir);
    expect(preflight.pm2Calls()).toEqual([]);

    for (const options of [
      { pm2Pids: '4242,4243' },
      { procCwd: '/tmp/not-the-candidate' },
      { procExe: '/tmp/node20' },
    ]) {
      const attempt = runCandidate(options);

      expect(attempt.result.status, attempt.result.stderr).toBe(1);
      expect(attempt.result.stderr).toContain('Candidate process identity is not stable.');
    }
  }, 15_000);

  it('rejects a current mismatch, Node 20 drift, and arithmetic health-timeout injection before mutation', () => {
    const mismatch = runCandidate({ currentTarget: 'candidate' });

    expect(mismatch.result.status, mismatch.result.stderr).toBe(1);
    expect(mismatch.result.stderr).toContain('Current release does not match declared rollback SHA.');
    expect(mismatch.currentTarget()).toBe(mismatch.releaseDir);
    expect(mismatch.pm2Calls()).toEqual([]);

    for (const [options, message] of [
      [{ node20Path: '/tmp/not-node20' }, 'Node 20 runtime is unavailable.'],
      [{ node20Version: 'v20.19.5' }, 'Node 20 runtime version drift.'],
      [{ node20Pm2Version: '5.4.2' }, 'Node 20 PM2 version drift.'],
      [{ healthTimeout: 'x[$(node)]' }, 'Health timeout is invalid.'],
    ] as const) {
      const attempt = runCandidate(options);

      expect(attempt.result.status, attempt.result.stderr).toBe(1);
      expect(attempt.result.stderr).toBe(`${message}\n`);
      expect(attempt.poisonUsed()).toBe(false);
      expect(attempt.currentTarget()).toBe(attempt.rollbackDir);
      expect(attempt.pm2Calls()).toEqual([]);
    }
  });

  it('recovers a failed candidate through only the declared Node 20 runtime', () => {
    const attempt = runCandidate({ candidateStartFails: true });

    expect(attempt.result.status, attempt.result.stderr).toBe(42);
    expect(attempt.result.stderr).toBe('activation=failed; rollback=passed\n');
    expect(attempt.currentTarget()).toBe(attempt.rollbackDir);
    expect(attempt.poisonUsed()).toBe(false);
    expect(attempt.pm2Calls().map((call) => call.split('|')[2])).toEqual(['describe', 'delete', 'start', 'delete']);
    expect(attempt.node20Pm2Calls().map((call) => call.split('|')[2])).toEqual(['start', 'pid', 'pid']);
    for (const call of attempt.node20Pm2Calls()) expect(call.split('|').slice(0, 2)).toEqual([attempt.node20, attempt.rollbackDir]);
  });

  it('reports rollback-link restoration failure without hiding the candidate failure', () => {
    const attempt = runCandidate({ candidateStartFails: true, rollbackLinkRestoreFails: true });

    expect(attempt.result.status, attempt.result.stderr).toBe(42);
    expect(attempt.result.stderr).toBe('activation=failed; rollback=failed\n');
    expect(attempt.currentTarget()).toBe(attempt.releaseDir);
    expect(attempt.mvCalls().some((call) => call.includes('/.current.rollback.'))).toBe(true);
  });

  it('reports failed recovery when stop, start, health, or rollback process identity verification fails', () => {
    for (const options of [
      { candidateDeleteFails: true },
      { rollbackStartFails: true },
      { rollbackHealthStatus: '503' },
      { rollbackPids: '5252,5253' },
      { rollbackProcExe: '/tmp/not-node20' },
      { rollbackProcCwd: '/tmp/not-the-rollback' },
    ]) {
      const attempt = runCandidate({ candidateStartFails: true, ...options });

      expect(attempt.result.status, attempt.result.stderr).toBe(42);
      expect(attempt.result.stderr).toBe('activation=failed; rollback=failed\n');
      expect(attempt.currentTarget()).toBe(attempt.rollbackDir);
    }
  }, 15_000);
});
