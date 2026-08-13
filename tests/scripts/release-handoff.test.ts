import { chmodSync, cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/handoff-release.sh');
const prepareScriptPath = resolve(process.cwd(), 'ops/scripts/prepare-release.sh');
const releaseSha = '835dd149c0ab2b3b4646d625adaefb63a0df3183';
const temporaryDirectories: string[] = [];
type ReceiptReplacement = Partial<Record<'releaseDir' | 'owner' | 'group' | 'mode', string>>;

function temporaryDirectory() {
  const directory = mkdtempSync(join(tmpdir(), 'botanica-handoff-'));
  temporaryDirectories.push(directory);
  return directory;
}

function command(directory: string, name: string, source: string) {
  writeFileSync(join(directory, name), `#!/bin/sh\n${source}`);
  chmodSync(join(directory, name), 0o755);
}

function run(options: Record<string, string> = {}) {
  const root = temporaryDirectory();
  const bin = join(root, 'bin');
  const sshCalls = join(root, 'ssh-calls');
  const archiveCalls = join(root, 'archive-calls');
  mkdirSync(bin);
  command(bin, 'ssh', `
    calls=0
    if [ -f "$SSH_CALLS" ]; then calls=$(wc -l < "$SSH_CALLS"); fi
    calls=$((calls + 1))
    printf 'call\\n' >> "$SSH_CALLS"
    if [ "\${MOCK_SSH_STATUS-0}" -ne 0 ]; then exit "$MOCK_SSH_STATUS"; fi
    if [ "$calls" -eq 1 ] && [ "$HANDOFF_RECEIPT_ONLY" = 1 ]; then
      printf '%s\\n' "$MOCK_REMOTE_OUTPUT"
    elif [ "$calls" -eq 1 ]; then
      if [ "\${MOCK_EXECUTE_PREFLIGHT-0}" = 1 ]; then
        env -i PATH="$PATH" /bin/sh -c "$2"
      else
        printf '%s\\n' 'handoff-user' 'handoff-group' 'handoff-user:handoff-group 750'
      fi
    else
      cat >/dev/null
    fi
  `);
  command(bin, 'git', `printf '%s\\n' "$*" >> "$ARCHIVE_CALLS"\nprintf 'archive bytes'`);

  const result = spawnSync('/bin/sh', [scriptPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      RELEASE_SHA: releaseSha,
      REMOTE_HOST: 'handoff.test',
      REMOTE_APP_ROOT: '/srv/botanica-ob',
      EXPECTED_RELEASE_OWNER: 'handoff-user',
      EXPECTED_RELEASE_GROUP: 'handoff-group',
      EXPECTED_RELEASE_MODE: '750',
      RECEIPT_ENDPOINT_SELECTOR: 'receipt-test-endpoint',
      MOCK_REMOTE_OUTPUT: [
        `active_release=${releaseSha}`,
        'effective_root=/srv/botanica-ob',
        `release_dir=/srv/botanica-ob/releases/${releaseSha}`,
        'owner=handoff-user',
        'group=handoff-group',
        'mode=750',
      ].join('\n'),
      SSH_CALLS: sshCalls,
      ARCHIVE_CALLS: archiveCalls,
      PATH: `${bin}:${process.env.PATH}`,
      ...options,
    },
  });

  return {
    archiveCalls: () => existsSync(archiveCalls) ? readFileSync(archiveCalls, 'utf8').trim().split('\n').filter(Boolean).length : 0,
    result,
    sshCalls: () => existsSync(sshCalls) ? readFileSync(sshCalls, 'utf8').trim().split('\n').filter(Boolean).length : 0,
  };
}

function runPreparationHandoff(options: { expectedGroup?: string; expectedOwner?: string; preflightFailure?: string; targetContains?: string } = {}) {
  const root = temporaryDirectory();
  const appRoot = join(root, 'app');
  const archiveSource = join(root, 'archive-source');
  const bin = join(root, 'bin');
  const archiveCalls = join(root, 'archive-calls');
  const releaseDirectory = join(appRoot, 'releases', releaseSha);
  const owner = spawnSync('id', ['-un'], { encoding: 'utf8' }).stdout.trim();
  const group = spawnSync('id', ['-gn'], { encoding: 'utf8' }).stdout.trim();

  mkdirSync(join(appRoot, 'ops', 'scripts'), { recursive: true });
  cpSync(prepareScriptPath, join(appRoot, 'ops', 'scripts', 'prepare-release.sh'));
  mkdirSync(join(archiveSource, 'ops', 'scripts'), { recursive: true });
  writeFileSync(join(archiveSource, 'package.json'), '{"scripts":{"build":"true"}}\n');
  writeFileSync(join(archiveSource, 'ops', 'scripts', 'activate-pm2-release.sh'), 'readonly RELEASE_ID="${1:-}"\n');
  mkdirSync(releaseDirectory, { recursive: true });
  chmodSync(releaseDirectory, 0o750);
  if (options.targetContains) writeFileSync(join(releaseDirectory, options.targetContains), 'already here\n');
  mkdirSync(bin);
  command(bin, 'git', `printf 'archive\n' >> "$ARCHIVE_CALLS"\ntar -cf - -C "$ARCHIVE_SOURCE" .`);
  command(bin, 'npm', 'exit 0');
  command(bin, 'ssh', `
    if [ "$2" = "RELEASE_SHA='$releaseSha' /bin/sh '$appRoot/releases/$releaseSha/ops/scripts/prepare-release.sh'" ]; then
      printf '%s\\n' 'unexpected in-target preparer' >&2
      exit 97
    fi
    if [ "\${MOCK_PREFLIGHT_FAILURE-0}" -ne 0 ]; then exit "$MOCK_PREFLIGHT_FAILURE"; fi
    case "$2" in
      *"stat -c"*) printf '%s\\n' "$EXPECTED_RELEASE_OWNER" "$EXPECTED_RELEASE_GROUP" "$EXPECTED_RELEASE_OWNER:$EXPECTED_RELEASE_GROUP 750" ;;
      *) env -i PATH="$PATH" /bin/sh -c "$2" ;;
    esac
  `);

  const result = spawnSync('/bin/sh', [scriptPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ARCHIVE_SOURCE: archiveSource,
      EXPECTED_RELEASE_GROUP: options.expectedGroup ?? group,
      EXPECTED_RELEASE_MODE: '750',
      EXPECTED_RELEASE_OWNER: options.expectedOwner ?? owner,
      ARCHIVE_CALLS: archiveCalls,
      MOCK_APP_ROOT: appRoot,
      MOCK_PREFLIGHT_FAILURE: options.preflightFailure ?? '0',
      PATH: `${bin}:${process.env.PATH}`,
      RELEASE_SHA: releaseSha,
      REMOTE_APP_ROOT: appRoot,
      REMOTE_HOST: 'handoff.test',
    },
  });

  return {
    archiveCalls: () => existsSync(archiveCalls) ? readFileSync(archiveCalls, 'utf8').trim().split('\n').filter(Boolean).length : 0,
    releaseDirectory,
    result,
  };
}

afterEach(() => temporaryDirectories.splice(0).forEach((directory) => {
  spawnSync('/bin/chmod', ['-R', 'u+w', directory]);
  rmSync(directory, { recursive: true, force: true });
}));

describe('POSIX release handoff', () => {
  it.each([
    ['empty', ''],
    ['short', 'a'.repeat(39)],
    ['uppercase', 'A'.repeat(40)],
    ['non-hex', 'g'.repeat(40)],
  ])('rejects an %s release SHA before any SSH call', (_name, invalidReleaseSha) => {
    const attempt = run({ RELEASE_SHA: invalidReleaseSha });

    expect(attempt.result.status, attempt.result.stderr).not.toBe(0);
    expect(attempt.result.stderr).toContain('stage=input');
    expect(attempt.sshCalls()).toBe(0);
  });

  it('preflights and transfers a valid release SHA', () => {
    const attempt = run();

    expect(attempt.result.status, attempt.result.stderr).toBe(0);
    expect(attempt.result.stderr).toContain('stage=transferred');
    expect(attempt.sshCalls()).toBe(2);
    expect(attempt.archiveCalls()).toBe(1);
  });

  it('treats an apostrophe-bearing remote app root as a literal preflight path', () => {
    const remoteAppRoot = join(temporaryDirectory(), "app' ; false #");
    const owner = spawnSync('id', ['-un'], { encoding: 'utf8' }).stdout.trim();
    const group = spawnSync('id', ['-gn'], { encoding: 'utf8' }).stdout.trim();
    mkdirSync(join(remoteAppRoot, 'releases', releaseSha), { recursive: true });
    chmodSync(join(remoteAppRoot, 'releases', releaseSha), 0o750);

    const attempt = run({
      EXPECTED_RELEASE_GROUP: group,
      EXPECTED_RELEASE_OWNER: owner,
      MOCK_EXECUTE_PREFLIGHT: '1',
      REMOTE_APP_ROOT: remoteAppRoot,
    });

    expect(attempt.result.status, attempt.result.stderr).toBe(0);
    expect(attempt.sshCalls()).toBe(2);
    expect(attempt.archiveCalls()).toBe(1);
  });

  it('prepares an empty target with the external versioned preparer', () => {
    const attempt = runPreparationHandoff();

    expect(attempt.result.status, attempt.result.stderr).toBe(0);
    expect(readFileSync(join(attempt.releaseDirectory, 'package.json'), 'utf8')).toContain('"build"');
    expect(existsSync(join(attempt.releaseDirectory, 'ops', 'scripts', 'activate-pm2-release.sh'))).toBe(true);
  });

  it('forwards policy values to the isolated remote preparer without shell injection', () => {
    const attempt = runPreparationHandoff({
      expectedGroup: `${spawnSync('id', ['-gn'], { encoding: 'utf8' }).stdout.trim()}; false`,
      expectedOwner: `${spawnSync('id', ['-un'], { encoding: 'utf8' }).stdout.trim()}; false`,
    });

    expect(attempt.result.status, attempt.result.stderr).not.toBe(0);
    expect(attempt.result.stderr).toContain('stage=owner');
    expect(existsSync(join(attempt.releaseDirectory, 'package.json'))).toBe(false);
  });

  it('rejects a non-empty target before archive extraction', () => {
    const attempt = runPreparationHandoff({ targetContains: 'unexpected.txt' });

    expect(attempt.result.status, attempt.result.stderr).not.toBe(0);
    expect(attempt.result.stderr).toContain('stage=not_empty');
    expect(attempt.archiveCalls()).toBe(1);
    expect(existsSync(join(attempt.releaseDirectory, 'package.json'))).toBe(false);
  });

  it('prevents transfer when ordinary preflight fails', () => {
    const attempt = runPreparationHandoff({ preflightFailure: '23' });

    expect(attempt.result.status, attempt.result.stderr).toBe(23);
    expect(attempt.result.stderr).toContain('stage=preflight');
    expect(attempt.archiveCalls()).toBe(0);
  });

  it('derives the active release and root in exactly one receipt-only query', () => {
    const attempt = run({
      HANDOFF_RECEIPT_ONLY: '1',
      RELEASE_SHA: '',
      REMOTE_APP_ROOT: '',
      REMOTE_HOST: '',
    });

    expect(attempt.result.status, attempt.result.stderr).toBe(0);
    expect(attempt.result.stderr).toContain(`release=${releaseSha}`);
    expect(attempt.result.stderr).toContain('stage=receipt-preflight');
    expect(attempt.result.stderr).toContain('identity=matched');
    expect(attempt.result.stderr).toContain('metadata=matched');
    expect(attempt.result.stderr).toContain('connection_count=1');
    expect(attempt.result.stderr).toContain('effective_root=derived');
    expect(attempt.result.stderr).toContain('transfer=absent');
    expect(attempt.result.stderr).toContain('preparation=absent');
    expect(attempt.result.stderr).toContain('activation=absent');
    expect(attempt.sshCalls()).toBe(1);
    expect(attempt.archiveCalls()).toBe(0);
  });

  it('fails closed after one unsuccessful receipt-only query', () => {
    const attempt = run({ HANDOFF_RECEIPT_ONLY: '1', MOCK_SSH_STATUS: '23' });

    expect(attempt.result.status, attempt.result.stderr).toBe(23);
    expect(attempt.result.stderr).toContain('stage=receipt-preflight');
    expect(attempt.result.stderr).toContain('connection_count=1');
    expect(attempt.result.stderr).toContain('transfer=absent');
    expect(attempt.sshCalls()).toBe(1);
    expect(attempt.archiveCalls()).toBe(0);
  });

  it.each([
    ['selector', { RECEIPT_ENDPOINT_SELECTOR: '' }],
    ['owner policy', { EXPECTED_RELEASE_OWNER: '' }],
    ['group policy', { EXPECTED_RELEASE_GROUP: '' }],
    ['mode policy', { EXPECTED_RELEASE_MODE: '' }],
  ])('rejects a missing receipt-only %s before remote work', (_name, options) => {
    const attempt = run({ HANDOFF_RECEIPT_ONLY: '1', ...options });

    expect(attempt.result.status, attempt.result.stderr).not.toBe(0);
    expect(attempt.result.stderr).toContain('stage=input');
    expect(attempt.sshCalls()).toBe(0);
    expect(attempt.archiveCalls()).toBe(0);
  });

  it.each([
    ['malformed', 'not-a-receipt'],
    ['unknown field', [
      `active_release=${releaseSha}`,
      'effective_root=/srv/botanica-ob',
      `release_dir=/srv/botanica-ob/releases/${releaseSha}`,
      'owner=handoff-user',
      'group=handoff-group',
      'mode=750',
      'unexpected=value',
    ].join('\n')],
    ['ambiguous', [
      `active_release=${releaseSha}`,
      `active_release=${'a'.repeat(40)}`,
      'effective_root=/srv/botanica-ob',
      `release_dir=/srv/botanica-ob/releases/${releaseSha}`,
      'owner=handoff-user',
      'group=handoff-group',
      'mode=750',
    ].join('\n')],
  ])('fails closed after one query for %s managed-release output', (_name, remoteOutput) => {
    const attempt = run({ HANDOFF_RECEIPT_ONLY: '1', MOCK_REMOTE_OUTPUT: remoteOutput });

    expect(attempt.result.status, attempt.result.stderr).not.toBe(0);
    expect(attempt.result.stderr).toContain('stage=receipt-preflight');
    expect(attempt.result.stderr).toContain('transfer=absent');
    expect(attempt.sshCalls()).toBe(1);
    expect(attempt.archiveCalls()).toBe(0);
  });

  it.each([
    ['release directory', { releaseDir: `/srv/botanica-ob/releases/${'a'.repeat(40)}` }, 'identity=failed'],
    ['owner', { owner: 'other-user' }, 'metadata=failed'],
    ['group', { group: 'other-group' }, 'metadata=failed'],
    ['mode', { mode: '755' }, 'metadata=failed'],
  ] as [string, ReceiptReplacement, string][])('fails closed after one query for a %s policy mismatch', (_name, replacement, expectedResult) => {
    const remoteOutput = [
      `active_release=${releaseSha}`,
      'effective_root=/srv/botanica-ob',
      `release_dir=${replacement.releaseDir ?? `/srv/botanica-ob/releases/${releaseSha}`}`,
      `owner=${replacement.owner ?? 'handoff-user'}`,
      `group=${replacement.group ?? 'handoff-group'}`,
      `mode=${replacement.mode ?? '750'}`,
    ].join('\n');
    const attempt = run({ HANDOFF_RECEIPT_ONLY: '1', MOCK_REMOTE_OUTPUT: remoteOutput });

    expect(attempt.result.status, attempt.result.stderr).not.toBe(0);
    expect(attempt.result.stderr).toContain('stage=receipt-preflight');
    expect(attempt.result.stderr).toContain(expectedResult);
    expect(attempt.result.stderr).toContain('transfer=absent');
    expect(attempt.sshCalls()).toBe(1);
    expect(attempt.archiveCalls()).toBe(0);
  });

  it('maps receipt-only documentation claims to named receipt fields', () => {
    const runbook = readFileSync(resolve(process.cwd(), 'docs/runbook.md'), 'utf8');
    const operationsSpec = readFileSync(resolve(process.cwd(), 'openspec/changes/direct-production-deployment/specs/production-operations/spec.md'), 'utf8');

    for (const field of ['connection_count', 'identity', 'metadata', 'effective_root', 'transfer', 'preparation', 'activation']) {
      expect(runbook).toContain(field);
    }
    expect(operationsSpec).toContain('receipt-only');
    expect(operationsSpec).toContain('unverified');
  });
});
