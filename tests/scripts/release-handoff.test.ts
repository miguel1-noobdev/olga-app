import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/handoff-release.sh');
const releaseSha = '835dd149c0ab2b3b4646d625adaefb63a0df3183';
const temporaryDirectories: string[] = [];

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
    printf '%s\\n' "$*" >> "$SSH_CALLS"
    if [ "$calls" -eq 1 ]; then
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

  it('stops after non-mutating preflight in receipt-only mode', () => {
    const attempt = run({ HANDOFF_RECEIPT_ONLY: '1' });

    expect(attempt.result.status, attempt.result.stderr).toBe(0);
    expect(attempt.result.stderr).toContain('stage=preflight');
    expect(attempt.sshCalls()).toBe(1);
    expect(attempt.archiveCalls()).toBe(0);
  });
});
