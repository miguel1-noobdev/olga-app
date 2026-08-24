import { chmodSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

const script = resolve(process.cwd(), 'ops/scripts/node24-prepare-release.sh');
const activation = resolve(process.cwd(), 'ops/scripts/activate-pm2-release.sh');
const temporary: string[] = [], digest = (value: Buffer) => createHash('sha256').update(value).digest('hex');
function fixture(options: Record<string, string | undefined> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'node24-prepare-')); temporary.push(root);
  const app = join(root, 'app'), release = join(app, 'releases', 'a'.repeat(40)), tools = join(root, 'tools'), source = join(root, 'source'), calls = join(root, 'calls');
  mkdirSync(release, { recursive: true }); mkdirSync(tools); mkdirSync(join(source, 'ops', 'scripts'), { recursive: true });
  writeFileSync(join(source, 'package.json'), '{"scripts":{"build":"true"}}\n');
  if (!options.MISSING_ACTIVATION) writeFileSync(join(source, 'ops', 'scripts', 'activate-pm2-release.sh'), options.ACTIVATION ?? readFileSync(activation));
  if (options.NONEMPTY) writeFileSync(join(release, 'occupied'), 'x');
  const node = join(tools, 'node'), npm = join(tools, 'npm-cli');
  writeFileSync(node, `#!/bin/sh\nprintf 'node:%s\n' "$*" >> "$CALLS"\nexec "$@"\n`);
  writeFileSync(npm, `#!/bin/sh\nprintf 'npm:%s\n' "$*" >> "$CALLS"\ncase "$*" in 'ci --offline') exit "${options.ci ?? '0'}";; 'run build --offline') exit "${options.build ?? '0'}";; esac\nexit 88\n`);
  chmodSync(node, options.NONEXEC_NODE ? 0o644 : 0o755); chmodSync(npm, 0o755);
  const archive = spawnSync('/usr/bin/tar', ['-cf', '-', '-C', source, '.'], { encoding: null });
  const input = options.MALFORMED ? Buffer.from('malformed') : archive.stdout!;
  const result = spawnSync('/bin/sh', [script], { input, encoding: 'utf8', env: { APP_ROOT: app, CALLS: calls, EXPECTED_RELEASE_OWNER: spawnSync('/usr/bin/id', ['-un'], { encoding: 'utf8' }).stdout.trim(), EXPECTED_RELEASE_GROUP: spawnSync('/usr/bin/id', ['-gn'], { encoding: 'utf8' }).stdout.trim(), EXPECTED_RELEASE_MODE: '755', NODE_ENV: 'test', RELEASE_SHA: 'a'.repeat(40), VERIFIED_NODE: node, VERIFIED_NPM_CLI: options.NPM_DIRECTORY ? tools : npm, VERIFIED_SOURCE_DIGEST: digest(input), PATH: '/evil', ...options } });
  return { calls: () => readFileSync(calls, 'utf8'), release, result, root, node, npm };
}
afterEach(() => { for (const path of temporary.splice(0)) { spawnSync('/bin/chmod', ['-R', 'u+w', path]); rmSync(path, { recursive: true, force: true }); } });

describe('dedicated Node 24 release preparer', () => {
  it('prepares, builds, seals, and does not activate', () => {
    const run = fixture(); expect(run.result.status, run.result.stderr).toBe(0);
    expect(run.calls()).toBe(`node:${join(run.root, 'tools', 'npm-cli')} ci --offline\nnpm:ci --offline\nnode:${join(run.root, 'tools', 'npm-cli')} run build --offline\nnpm:run build --offline\n`);
    expect(statSync(run.release).mode & 0o222).toBe(0); expect(readFileSync(join(run.release, 'package.json'), 'utf8')).toContain('build'); expect(readdirSync(run.release)).not.toContain('.node24-source');
  });
  it('rejects invalid inputs and archive identities before sealing', () => {
    const failures = [
      { NONEMPTY: '1' }, { EXPECTED_RELEASE_OWNER: 'wrong' }, { EXPECTED_RELEASE_GROUP: 'wrong' }, { EXPECTED_RELEASE_MODE: '750' }, { MALFORMED: '1' },
      { VERIFIED_SOURCE_DIGEST: '0'.repeat(64) }, { MISSING_ACTIVATION: '1' }, { ACTIVATION: '# readonly RELEASE_ID="${1:-}"\n' },
      { VERIFIED_NODE: 'node' }, { VERIFIED_NODE: '/node' }, { VERIFIED_NODE: '/missing' }, { NONEXEC_NODE: '1' }, { VERIFIED_NPM_CLI: 'npm' }, { VERIFIED_NPM_CLI: '/npm' }, { VERIFIED_NPM_CLI: '/missing' }, { NPM_DIRECTORY: '1' },
    ];
    for (const change of failures) expect(fixture(change).result.status).not.toBe(0);
    const run = fixture({ VERIFIED_SOURCE_DIGEST: '0'.repeat(64) }); expect(readdirSync(run.release)).not.toContain('.node24-source');
  });
  it('reports install/build failures and sanitizes release diagnostics', () => {
    expect(fixture({ ci: '31' }).result.status).toBe(31); expect(fixture({ build: '32' }).result.status).toBe(32);
    const run = fixture({ RELEASE_SHA: 'bad\npreparation=passed' }); expect(run.result.status).toBe(1); expect(run.result.stderr).not.toContain('bad\n');
  });
  // #71 owns a real distinct-user chmod fault rehearsal; this asserts safe seal ordering without injection.
  it('verifies activation before sealing', () => {
    const source = readFileSync(script, 'utf8');
    const activationIndex = source.indexOf('activation_identity'); const sealIndex = source.indexOf('/usr/bin/chmod -R a-w');
    expect(activationIndex).toBeGreaterThan(-1); expect(sealIndex).toBeGreaterThan(-1); expect(activationIndex).toBeLessThan(sealIndex);
  });
});
