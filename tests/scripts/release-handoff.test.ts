import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/handoff-release.sh');
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
      printf '%s\\n' 'handoff-user' 'handoff-group' 'handoff-user:handoff-group 750'
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

afterEach(() => temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

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
