import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/prepare-release.sh');
const releaseSha = '835dd149c0ab2b3b4646d625adaefb63a0df3183';
const nodeVersion = 'v24.13.1';
const npmVersion = '11.10.0';
const temporaryDirectories: string[] = [];
type GuardCase =
  | [stage: string, environment: Record<string, string>, setup: (target: string) => void, stat: undefined]
  | [stage: string, environment: Record<string, string>, setup: undefined, stat: string];
type RuntimeOptions = {
  binaryMode?: string; binaryOwner?: string;
  configMode?: string; configNodePath?: string;
  configOwner?: string;
  configShape?: 'reordered';
  configSymlink?: boolean;
  missingCli?: boolean;
  nodeReportedVersion?: string;
  nonCanonicalNode?: boolean;
  npmMode?: string; npmOwner?: string;
  npmReportedVersion?: string;
  symlinkNode?: boolean;
};

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
  runtime: RuntimeOptions = {},
) {
  const root = temporaryDirectory();
  const target = join(root, 'releases', releaseSha);
  const bin = join(root, 'bin');
  const runtimeDirectory = join(root, 'runtime');
  const realNode = join(runtimeDirectory, 'node-real');
  const nodeBin = join(runtimeDirectory, 'node');
  const npmCli = join(runtimeDirectory, 'npm-cli.js');
  const config = join(root, 'config', 'node24-runtime.conf');
  const configSource = runtime.configSymlink ? join(root, 'node24-runtime.source') : config;
  const runtimeCalls = join(root, 'runtime-calls');
  mkdirSync(target, { recursive: true });
  mkdirSync(bin);
  mkdirSync(runtimeDirectory);
  mkdirSync(join(root, 'config'));
  chmodSync(target, 0o750);
  prepare?.(target);
  const owner = spawnSync('id', ['-un'], { encoding: 'utf8' }).stdout.trim();
  const group = spawnSync('id', ['-gn'], { encoding: 'utf8' }).stdout.trim();
  command(runtimeDirectory, 'node-real', `
    printf '%s|%s|%s\\n' "$PATH" "\${npm_config_script_shell-}" "$*" >> "$RUNTIME_CALLS"
    if [ "$#" -eq 1 ] && [ "$1" = '--version' ]; then printf '%s\\n' "$NODE_REPORTED_VERSION"; exit 0; fi
    if [ "$1" != "$NPM_CLI_FIXTURE" ]; then exit 97; fi
    if [ "$2" = '--version' ]; then printf '%s\\n' "$NPM_REPORTED_VERSION"; exit 0; fi
    if [ "$2" = 'ci' ]; then exit "$MOCK_CI_STATUS"; fi
    if [ "$2" = 'run' ] && [ "$3" = 'build' ]; then exit "$MOCK_BUILD_STATUS"; fi
    exit 98
  `);
  if (runtime.symlinkNode) symlinkSync(realNode, nodeBin);
  else writeFileSync(nodeBin, readFileSync(realNode));
  chmodSync(nodeBin, 0o555);
  for (const utility of ['tar', 'grep', 'chmod']) {
    command(runtimeDirectory, utility, `printf 'runtime-utility:%s\\n' '${utility}' >> "$RUNTIME_CALLS"\nexec /usr/bin/${utility} "$@"\n`);
  }
  if (!runtime.missingCli) {
    writeFileSync(npmCli, '// npm CLI fixture\n');
    chmodSync(npmCli, 0o444);
  }
    const configuredNode = runtime.configNodePath ?? (runtime.nonCanonicalNode ? `${runtimeDirectory}/../runtime/node` : nodeBin);
  const configLines = [
    `NODE24_BIN=${configuredNode}`,
    `NODE24_VERSION=${nodeVersion}`,
    `NPM_CLI=${npmCli}`,
    `NPM_VERSION=${npmVersion}`,
  ];
  if (runtime.configShape === 'reordered') configLines.reverse();
  writeFileSync(configSource, `${configLines.join('\n')}\n`);
  if (runtime.configSymlink) symlinkSync(configSource, config);
  chmodSync(configSource, 0o444);
  const { stat: releaseStat, ...commandOverrides } = commands;
  const defaults = {
    id: `if [ "$1" = '-un' ]; then printf '%s\\n' '${owner}'; else printf '%s\\n' '${group}'; fi\n`,
    stat: `
      target=''; for argument in "$@"; do target=$argument; done
        if [ "$2" = '%U:%G %a' ]; then
          ${releaseStat ?? `printf '%s\\n' '${owner}:${group} 750'`}
          exit $?
        fi
        case "$target" in
"$APP_ROOT/config/node24-runtime.conf") printf '%s\\n' '${runtime.configOwner ?? 'root'} ${runtime.configMode ?? '644'}' ;;
"$NODE24_BIN_FIXTURE") printf '%s\\n' '${runtime.binaryOwner ?? 'root'} ${runtime.binaryMode ?? '555'}' ;;
"$NPM_CLI_FIXTURE") printf '%s\\n' '${runtime.npmOwner ?? 'root'} ${runtime.npmMode ?? '444'}' ;;
*) exit 96 ;;
      esac
    `,
    tar: `/bin/mkdir -p "$RELEASE_DIR/ops/scripts"\nprintf 'release\\n' > "$RELEASE_DIR/app.txt"\nprintf 'readonly RELEASE_ID="\${1:-}"\\n' > "$RELEASE_DIR/ops/scripts/activate-pm2-release.sh"\n`,
  };
  for (const [name, source] of Object.entries({ ...defaults, ...commandOverrides })) command(bin, name, source);
    const result = spawnSync('/usr/bin/unshare', ['-Ur', '-m', '/bin/sh', '-ceu', `
      /usr/bin/mount --make-rprivate /
      for utility in "$FAKE_BIN"/*; do [ -f "$utility" ] && /usr/bin/mount --bind "$utility" "/usr/bin/$(/usr/bin/basename "$utility")"; done
      if [ "\${PREPARATION_DROP_ROOT_PRIVILEGES-}" = 1 ]; then /usr/bin/setpriv --securebits +noroot /bin/sh "$SCRIPT"; else /bin/sh "$SCRIPT"; fi
    `], {
    encoding: 'utf8',
    input: 'archive bytes',
    env: {
      NODE_ENV: 'test',
      APP_ROOT: root,
      EXPECTED_RELEASE_GROUP: group,
      EXPECTED_RELEASE_OWNER: owner,
      EXPECTED_RELEASE_MODE: '750',
      FAKE_BIN: bin,
      MOCK_BUILD_STATUS: options.MOCK_BUILD_STATUS ?? '0',
      MOCK_CI_STATUS: options.MOCK_CI_STATUS ?? '0',
      NODE24_BIN_FIXTURE: nodeBin,
      NODE24_CONFIG: join(root, 'ambient-override-must-not-be-used'),
      NODE_REPORTED_VERSION: runtime.nodeReportedVersion ?? nodeVersion,
      NPM_CLI_FIXTURE: npmCli,
      NPM_REPORTED_VERSION: runtime.npmReportedVersion ?? npmVersion,
      PATH: `${join(root, 'ambient-bin')}:${bin}`,
      RELEASE_DIR: target,
      RELEASE_SHA: options.RELEASE_SHA ?? releaseSha,
      RUNTIME_CALLS: runtimeCalls,
      SCRIPT: scriptPath,
      ...options,
    },
  });
  return { npmCli, result, runtimeCalls, runtimeDirectory, target };
}

function record(result: SpawnSyncReturns<string>, stage: string, status: number, release = releaseSha) {
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
  it('archives only deployable release content', () => {
    const archivePath = join(temporaryDirectory(), 'release.tar');
    const archive = spawnSync('git', ['archive', '--worktree-attributes', '--format=tar', '--output', archivePath, 'HEAD'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(archive.status, archive.stderr).toBe(0);

    const listing = spawnSync('tar', ['-tf', archivePath], { encoding: 'utf8' });
    expect(listing.status, listing.stderr).toBe(0);
    const entries = listing.stdout.split('\n');

    expect(entries).toContain('src/app/layout.tsx');
    expect(entries).toContain('ops/scripts/prepare-release.sh');
    expect(entries).toContain('ops/scripts/activate-pm2-release.sh');
    expect(entries).toContain('public/img/hero-img2.png');
    expect(entries).toContain('package.json');
    expect(entries).toContain('package-lock.json');
    expect(entries.some((entry) => entry.startsWith('ideas/'))).toBe(false);
    expect(entries.some((entry) => entry.startsWith('tests/'))).toBe(false);
    expect(entries).not.toContain('.env.example');
  });

    it('selects the configured runtime explicitly, prepares, and seals the exact candidate', () => {
      const { npmCli, result, runtimeCalls, runtimeDirectory, target } = run();
      const nodeBin = join(runtimeDirectory, 'node');
      const shadowBin = join(temporaryDirectory(), 'node_modules', '.bin');
      mkdirSync(shadowBin, { recursive: true });
      command(shadowBin, 'node', "printf 'shadowed\\n'");
      const lifecycleEnvironment = {
        NODE_REPORTED_VERSION: nodeVersion,
        PATH: shadowBin,
        PREPARATION_LIFECYCLE_NODE: nodeBin,
        PREPARATION_LIFECYCLE_SHELL: '1',
        RUNTIME_CALLS: runtimeCalls,
        npm_node_execpath: nodeBin,
      };
      const invokeLifecycle = (args: string[], env: Record<string, string>) =>
        spawnSync(scriptPath, args, { encoding: 'utf8', env: env as NodeJS.ProcessEnv });
      const mismatchedEnvironment = { ...lifecycleEnvironment, npm_node_execpath: join(runtimeDirectory, 'other-node') };
      const malformedEnvironment = { ...lifecycleEnvironment, PREPARATION_LIFECYCLE_SHELL: 'invalid' };
      const lifecycle = invokeLifecycle(['-c', 'node --version'], lifecycleEnvironment);
      const mismatch = invokeLifecycle(['-c', 'node --version'], mismatchedEnvironment);
      const malformed = invokeLifecycle([], malformedEnvironment);
      expect(result.status, result.stderr).toBe(0);
      expect(lifecycle.error).toBeUndefined();
      expect(lifecycle.status, lifecycle.stderr).toBe(0);
      expect(lifecycle.stdout).toBe(`${nodeVersion}\n`);
      expect([mismatch.status, malformed.status]).not.toContain(0);
      expect(`${lifecycle.stderr}${mismatch.stderr}${malformed.stderr}`).not.toContain('preparation=');
      expect(result.stderr).toMatch(
        new RegExp(`preparation=passed release=${releaseSha} .*stage=sealed status=0 node_version=${nodeVersion} npm_version=${npmVersion}`),
      );
      expect(result.stderr).not.toContain(target);
      expect(readFileSync(runtimeCalls, 'utf8').trim().split('\n')).toEqual([
        `/usr/bin:/bin||--version`,
        `/usr/bin:/bin|${scriptPath}|${npmCli} --version`,
        `/usr/bin:/bin|${scriptPath}|${npmCli} ci`,
        `/usr/bin:/bin|${scriptPath}|${npmCli} run build`,
        `${runtimeDirectory}:${shadowBin}||--version`,
      ]);
      expect(readFileSync(join(target, 'app.txt'), 'utf8')).toBe('release\n');
      expect(existsSync(join(target, 'ops', 'scripts', 'activate-pm2-release.sh'))).toBe(true);
      for (const path of [target, join(target, 'app.txt'), join(target, 'ops'), join(target, 'ops', 'scripts'), join(target, 'ops', 'scripts', 'activate-pm2-release.sh')]) {
        expect(statSync(path).mode & 0o222, `${path} must be sealed`).toBe(0);
      }
    });
    it.each([
      ['node version', { nodeReportedVersion: 'v24.13.0' }, 'runtime_node_version'],
      ['npm version', { npmReportedVersion: '11.9.0' }, 'runtime_npm_version'],
      ['relative node path', { configNodePath: 'runtime/node' }, 'runtime_path'],
      ['non-canonical node path', { nonCanonicalNode: true }, 'runtime_path'],
      ['reordered config', { configShape: 'reordered' }, 'runtime_config_shape'],
      ['symlinked config', { configSymlink: true }, 'runtime_config'],
      ['non-root config', { configOwner: 'release-user' }, 'runtime_config_metadata'],
      ['writable config', { configMode: '664' }, 'runtime_config_metadata'],
      ['symlinked node', { symlinkNode: true }, 'runtime_node'],
      ['release-account-owned node', { binaryOwner: 'release-user' }, 'runtime_node_metadata'],
      ['writable node', { binaryMode: '755' }, 'runtime_node_metadata'],
      ['release-account-owned npm CLI', { npmOwner: 'release-user' }, 'runtime_npm_metadata'],
      ['writable npm CLI', { npmMode: '644' }, 'runtime_npm_metadata'],
      ['missing npm CLI', { missingCli: true }, 'runtime_npm'],
    ] satisfies [string, RuntimeOptions, string][])(
      'rejects %s before archive extraction or install/build',
      (_name, runtime, stage) => {
        const attempt = run({}, {}, undefined, runtime);
        record(attempt.result, stage, 1);
        expect(existsSync(join(attempt.target, 'app.txt'))).toBe(false);
        if (existsSync(attempt.runtimeCalls)) {
          expect(readFileSync(attempt.runtimeCalls, 'utf8')).not.toMatch(/(?:^|\n).* (?:ci|run build)$/);
        }
      },
    );

  it('rejects invalid release input before extraction', () => {
    const { result, target } = run({ RELEASE_SHA: 'not-a-sha' });
    record(result, 'input', 1, 'unverified');
    expect(result.stderr).not.toContain('not-a-sha');
    expect(existsSync(join(target, 'app.txt'))).toBe(false);
  });

  it('fixes production utility resolution and sanitizes an unvalidated release receipt', () => {
    const root = temporaryDirectory();
    const ambientBin = join(root, 'ambient-bin');
    const ambientDateCall = join(root, 'ambient-date-call');
    mkdirSync(ambientBin);
    command(ambientBin, 'date', `printf called > '${ambientDateCall}'\nprintf 'forged-timestamp\\n'`);
    const result = spawnSync('/bin/sh', [scriptPath], {
      encoding: 'utf8',
      env: {
        NODE_ENV: 'test',
        APP_ROOT: root,
        EXPECTED_RELEASE_GROUP: 'unused',
        EXPECTED_RELEASE_OWNER: 'unused',
        PATH: ambientBin,
        RELEASE_SHA: 'bad\nstage=sealed status=0',
      },
    });
    record(result, 'input', 1, 'unverified');
    expect(result.stderr).not.toContain('stage=sealed status=0');
    expect(existsSync(ambientDateCall)).toBe(false);
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
    ['missing', {}, (target: string) => rmSync(target, { recursive: true }), undefined],
    ['not_empty', {}, (target: string) => writeFileSync(join(target, 'keep'), 'keep'), undefined],
    ['owner', {}, undefined, "printf '%s\\n' 'other:group 750'\n"],
    ['group', {}, undefined, "printf '%s\\n' 'OWNER:other 750'\n"],
    ['mode', {}, undefined, "printf '%s\\n' 'OWNER:GROUP 700'\n"],
    ['writable', { PREPARATION_DROP_ROOT_PRIVILEGES: '1' }, undefined, "printf '%s\\n' 'OWNER:GROUP 750'\n/bin/chmod 500 \"$RELEASE_DIR\"\n"],
  ] satisfies GuardCase[])('fails closed at the %s guard before extraction', (stage, environment, setup, stat) => {
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
    ['id', {}, { id: 'exit 41\n' }, 41],
    ['stat', {}, { stat: 'exit 42\n' }, 42],
    ['archive_extract', {}, { tar: 'exit 43\n' }, 43],
    ['install', { MOCK_CI_STATUS: '44' }, {}, 44],
    ['build', { MOCK_BUILD_STATUS: '45' }, {}, 45],
    ['seal', {}, { chmod: 'exit 46\n' }, 46],
  ])('preserves the external %s status and records its stage', (stage, environment, commands, status) => {
    record(run(environment, commands).result, stage, status);
  });

  it('records a late activation identity failure without activating', () => {
    const { result, target } = run({}, {
      tar: 'mkdir -p "$RELEASE_DIR/ops/scripts"\nprintf "readonly RELEASE_ID=\\\"wrong\\\"\\n" > "$RELEASE_DIR/ops/scripts/activate-pm2-release.sh"\n',
    });
    record(result, 'activation_identity', 1);
    expect(existsSync(join(target, 'app.txt'))).toBe(false);
  });
});
