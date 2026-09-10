import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/activate-pm2-release.sh');
const releaseSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const temporaryDirectories: string[] = [];

type CandidateOptions = { pidDiagnostic?: string; pm2Version?: string; pm2Pids?: string; procCwd?: string; procExe?: string };

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
  const runtime = join(root, 'runtime');
  const poison = join(root, 'poison');
  const bin = join(root, 'bin');
  const config = join(appRoot, 'config', 'node24-runtime.conf');
  const node24 = join(runtime, 'node24');
  const node20 = join(runtime, 'node20');
  const pm2Cli = join(runtime, 'pm2-cli.js');
  const pm2Home = join(root, 'pm2-home');
  const secrets = join(root, 'secrets.env');
  const pm2Calls = join(root, 'pm2-calls');
  const poisonCalls = join(root, 'poison-calls');
  const node20Calls = join(root, 'node20-calls');
  const pidCalls = join(root, 'pid-calls');
  const runuserCalls = join(root, 'runuser-calls');
  temporaryDirectories.push(root);
  mkdirSync(join(releaseDir, 'ops', 'pm2'), { recursive: true });
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
    if [ "$2" = pid ]; then
      if [ -n "\${PID_DIAGNOSTIC-}" ]; then printf '%s\n' "$PID_DIAGNOSTIC" >&2; exit 33; fi
      calls=0; [ ! -f "$PID_CALLS" ] || calls=$(cat "$PID_CALLS")
      calls=$((calls + 1)); printf '%s' "$calls" > "$PID_CALLS"
      printf '%s\\n' "$(printf '%s' "$PM2_PIDS" | cut -d, -f "$calls")"
    fi
  `);
  command(runtime, 'node20', `printf 'node20\\n' >> "$NODE20_CALLS"; exit 98`);
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
  command(bin, 'curl', `printf '200'`);
  command(bin, 'readlink', `
    case "$2" in
      /proc/*/exe) printf '%s\\n' "$PROC_EXE" ;;
      /proc/*/cwd) printf '%s\\n' "$PROC_CWD" ;;
      *) exec /usr/bin/readlink "$@" ;;
    esac
  `);
  writeFileSync(config, [
    `NODE24_BIN=${node24}`,
    'NODE24_VERSION=v24.13.1',
    `NODE24_NPM_CLI=${join(runtime, 'npm-cli.js')}`,
    'NODE24_NPM_VERSION=11.10.0',
    `NODE20_BIN=${node20}`,
    'NODE20_VERSION=v20.19.6',
    `NODE20_PM2_CLI=${join(runtime, 'node20-pm2-cli.js')}`,
    'NODE20_PM2_VERSION=5.4.3',
    `NODE24_PM2_CLI=${pm2Cli}`,
    'NODE24_PM2_VERSION=5.4.3',
    'PM2_RUN_AS=candidate',
    `PM2_HOME=${pm2Home}`,
    '',
  ].join('\n'));
  chmodSync(config, 0o644);
  const ecosystem = join(releaseDir, 'ops', 'pm2', 'ecosystem.config.cjs');
  writeFileSync(ecosystem, 'module.exports = {};\n');
  chmodSync(ecosystem, 0o444);
  writeFileSync(secrets, 'MONGODB_URI=mongodb://fixture\nNEXTAUTH_SECRET=test\nNEXTAUTH_URL=http://127.0.0.1:3000\nINTERNAL_ACCOUNT_CHECK_ORIGIN=http://127.0.0.1:3000\n');
  chmodSync(secrets, 0o600);

  const result = spawnSync('/usr/bin/unshare', ['-Ur', '/bin/bash', scriptPath, releaseSha], {
    encoding: 'utf8',
    env: {
      NODE_ENV: 'test',
      APP_ROOT: appRoot, NODE24_BIN: join(poison, 'node'), PATH: `${bin}:${poison}:/usr/bin:/bin`,
      PM2_CALLS: pm2Calls, PM2_CLI: pm2Cli, PM2_PIDS: options.pm2Pids ?? '4242,4242',
      PID_DIAGNOSTIC: options.pidDiagnostic ?? '',
      PM2_REPORTED_VERSION: options.pm2Version ?? '5.4.3', NODE_REPORTED_VERSION: 'v24.13.1',
      NODE20_CALLS: node20Calls, PID_CALLS: pidCalls, POISON_CALLS: poisonCalls,
      PROC_CWD: options.procCwd ?? releaseDir, PROC_EXE: options.procExe ?? node24,
      RUNUSER_CALLS: runuserCalls, SECRETS_FILE: secrets,
    },
  });
  return {
    currentExists: () => existsSync(join(appRoot, 'current')),
    pm2Calls: () => existsSync(pm2Calls) ? readFileSync(pm2Calls, 'utf8').trim().split('\n').filter(Boolean) : [],
    poisonUsed: () => existsSync(poisonCalls) || existsSync(node20Calls),
    result,
    runuserCalls: () => existsSync(runuserCalls) ? readFileSync(runuserCalls, 'utf8') : '',
    node24,
    pm2Cli,
    releaseDir,
  };
}

afterEach(() => temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { force: true, recursive: true })));

describe('PM2 release activation script', () => {
  it('is valid executable shell and requires a caller-supplied immutable release SHA', () => {
    const syntax = spawnSync('bash', ['-n', scriptPath], { encoding: 'utf8' });
    const source = readFileSync(scriptPath, 'utf8');

    expect(syntax.status).toBe(0);
    expect(statSync(scriptPath).mode & 0o777).toBe(0o755);
    expect(source).toContain('#!/usr/bin/env bash');
    expect(source).toContain('readonly RELEASE_ID="${1:-}"');
    expect(source).not.toContain('b050790d8dc7ab9638dd74217c18cd770043401f');
    expect(source).toContain('RELEASE_DIR="$APP_ROOT/releases/$RELEASE_ID"');
    expect(source).toContain('CURRENT_LINK="$APP_ROOT/current"');
    expect(source).toContain('SECRETS_FILE="${SECRETS_FILE:-/etc/botanica-ob/secrets.env}"');

    for (const arguments_ of [[], ['not-a-sha'], ['A'.repeat(40)]]) {
      const result = run(...arguments_);

      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toContain('A full 40-character lowercase Git SHA is required.');
    }

    const validSha = run(releaseSha);

    expect(validSha.status, validSha.stderr).toBe(1);
    expect(validSha.stderr).toContain(`Prepared immutable release is unavailable: ${releaseSha}`);
  });

  it('rejects alternate application roots outside an unprivileged user namespace', () => {
    const alternateRoot = join(tmpdir(), 'alternate-release-root');
    const result = spawnSync('bash', [scriptPath, releaseSha], {
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
    expect(source).toContain('run_pm2 "$RELEASE_DIR" delete "$PM2_APP"');
    expect(source).toContain('mv -Tf "$restore_tmp" "$CURRENT_LINK"');
    expect(source).toContain('run_pm2 "$CURRENT_LINK" start "$CURRENT_LINK/ops/pm2/ecosystem.config.cjs"');
  });

  it('runs every candidate PM2 operation through configured Node 24 and waits within a bounded loopback window', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('"$NODE24_BIN" "$NODE24_PM2_CLI" "$@"');
    expect(source).not.toContain(' -- pm2 "$@"');
    expect(source).toContain('HEALTH_URL="http://127.0.0.1:3000/api/health"');
    expect(source).toContain('readonly HEALTH_TIMEOUT_SECONDS=30');
    expect(source).toContain('health_deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))');
    expect(source).toContain("die 'Loopback health check failed before readiness deadline.'");

    const attempt = runCandidate();

    expect(attempt.result.status, attempt.result.stderr).toBe(0);
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
    expect(attempt.result.stderr).toBe('activation=failed; rollback=attempted\n');
    expect(attempt.result.stderr).not.toContain(diagnostic);
  });

  it('rejects PM2 version drift before mutation and rejects unstable or drifted candidate processes', () => {
    const preflight = runCandidate({ pm2Version: '5.4.2' });

    expect(preflight.result.status, preflight.result.stderr).toBe(1);
    expect(preflight.result.stderr).toContain('Node 24 PM2 version drift.');
    expect(preflight.currentExists()).toBe(false);
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
  });
});
