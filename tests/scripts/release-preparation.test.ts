import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/prepare-release.sh');
const releaseSha = '835dd149c0ab2b3b4646d625adaefb63a0df3183';
const temporaryDirectories: string[] = [];

function temporaryDirectory() {
  const directory = mkdtempSync(join(tmpdir(), 'botanica-release-'));
  temporaryDirectories.push(directory);
  return directory;
}

function command(directory: string, name: string, source: string) {
  writeFileSync(join(directory, name), `#!/bin/sh\n${source}`);
  chmodSync(join(directory, name), 0o755);
}

function run(
  options: Record<string, string> = {},
  commands: Record<string, string> = {},
  prepare?: (target: string) => void,
) {
  const root = temporaryDirectory();
  const target = join(root, 'releases', releaseSha);
  const bin = join(root, 'bin');
  mkdirSync(target, { recursive: true });
  mkdirSync(bin);
  chmodSync(target, 0o750);
  prepare?.(target);
  const owner = spawnSync('id', ['-un'], { encoding: 'utf8' }).stdout.trim();
  const group = spawnSync('id', ['-gn'], { encoding: 'utf8' }).stdout.trim();
  const defaults = {
    id: `if [ "$1" = '-un' ]; then printf '%s\\n' '${owner}'; else printf '%s\\n' '${group}'; fi\n`,
    stat: `printf '%s\\n' '${owner}:${group} 750'\n`,
    tar: `mkdir -p "$RELEASE_DIR/ops/scripts"\nprintf 'release\\n' > "$RELEASE_DIR/app.txt"\nprintf 'readonly RELEASE_ID="%s"\\n' "$RELEASE_SHA" > "$RELEASE_DIR/ops/scripts/activate-pm2-release.sh"\n`,
    npm: `exit 0\n`,
    chmod: `/bin/chmod "$@"\n`,
  };
  for (const [name, source] of Object.entries({ ...defaults, ...commands })) command(bin, name, source);
  const result = spawnSync('/bin/sh', [scriptPath], {
    encoding: 'utf8',
    input: 'archive bytes',
    env: {
      ...process.env,
      APP_ROOT: root,
      RELEASE_SHA: releaseSha,
      EXPECTED_RELEASE_OWNER: owner,
      EXPECTED_RELEASE_GROUP: group,
      RELEASE_DIR: target,
      PATH: `${bin}:${process.env.PATH}`,
      ...options,
    },
  });
  return { result, target };
}

function record(result: ReturnType<typeof run>['result'], stage: string, status: number, release = releaseSha) {
  expect(result.status, result.stderr).toBe(status);
  expect(result.stderr).toMatch(
    new RegExp(`preparation=failed release=${release} timestamp=\\d{4}-\\d{2}-\\d{2}T[^ ]+ stage=${stage} status=${status}`),
  );
}

afterEach(() => temporaryDirectories.splice(0).forEach((directory) => {
  spawnSync('/bin/chmod', ['-R', 'u+w', directory]);
  rmSync(directory, { recursive: true, force: true });
}));

describe('local POSIX release preparation', () => {
  it('prepares, builds, verifies, and seals without activation', () => {
    const { result, target } = run();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toMatch(/preparation=passed .*stage=sealed status=0/);
    expect(readFileSync(join(target, 'app.txt'), 'utf8')).toBe('release\n');
    expect(existsSync(join(target, 'ops', 'scripts', 'activate-pm2-release.sh'))).toBe(true);
  });

  it('rejects invalid release input before extraction', () => {
    const { result, target } = run({ RELEASE_SHA: 'not-a-sha' });
    record(result, 'input', 1, 'not-a-sha');
    expect(existsSync(join(target, 'app.txt'))).toBe(false);
  });

  it('rejects a successful unexpected release owner before extraction', () => {
    const unexpectedOwner = 'unexpected-release-owner';
    const nonSecretSentinel = 'must-not-appear-in-preparation-record';
    const group = spawnSync('id', ['-gn'], { encoding: 'utf8' }).stdout.trim();
    const { result, target } = run(
      { PREPARATION_TEST_SECRET: nonSecretSentinel },
      {
        id: `if [ "$1" = '-un' ]; then printf '%s\\n' '${unexpectedOwner}'; else printf '%s\\n' '${group}'; fi\n`,
      },
    );

    record(result, 'owner', 1);
    expect(result.stderr).not.toContain(nonSecretSentinel);
    expect(existsSync(join(target, 'app.txt'))).toBe(false);
  });

  it.each([
    ['missing', {}, (target: string) => rmSync(target, { recursive: true })],
    ['not_empty', {}, (target: string) => writeFileSync(join(target, 'keep'), 'keep')],
    ['owner', {}, undefined, "printf '%s\\n' 'other:group 750'\n"],
    ['group', {}, undefined, "printf '%s\\n' 'OWNER:other 750'\n"],
    ['mode', {}, undefined, "printf '%s\\n' 'OWNER:GROUP 700'\n"],
    ['writable', {}, undefined, "printf '%s\\n' 'OWNER:GROUP 750'\n/bin/chmod 500 \"$RELEASE_DIR\"\n"],
  ])('fails closed at the %s guard before extraction', (stage, environment, setup, stat) => {
    if (stat) {
      const owner = spawnSync('id', ['-un'], { encoding: 'utf8' }).stdout.trim();
      const group = spawnSync('id', ['-gn'], { encoding: 'utf8' }).stdout.trim();
      const attempt = run(environment, { stat: stat.replace('OWNER', owner).replace('GROUP', group) });
      record(attempt.result, stage, 1);
      expect(existsSync(join(attempt.target, 'app.txt'))).toBe(false);
      return;
    }
    const { result, target } = run(environment, {}, setup);
    record(result, stage, 1);
    expect(existsSync(join(target, 'app.txt'))).toBe(false);
  });

  it.each([
    ['id', { id: 'exit 41\n' }, 41],
    ['stat', { stat: 'exit 42\n' }, 42],
    ['archive_extract', { tar: 'exit 43\n' }, 43],
    ['install', { npm: 'test "$1" = ci && exit 44\nexit 0\n' }, 44],
    ['build', { npm: 'test "$2" = build && exit 45\nexit 0\n' }, 45],
    ['seal', { chmod: 'exit 46\n' }, 46],
  ])('preserves the external %s status and records its stage', (stage, commands, status) => {
    record(run({}, commands).result, stage, status);
  });

  it('records a late activation identity failure without activating', () => {
    const { result, target } = run({}, {
      tar: 'mkdir -p "$RELEASE_DIR/ops/scripts"\nprintf "readonly RELEASE_ID=\\\"wrong\\\"\\n" > "$RELEASE_DIR/ops/scripts/activate-pm2-release.sh"\n',
    });
    record(result, 'activation_identity', 1);
    expect(existsSync(join(target, 'app.txt'))).toBe(false);
  });
});
