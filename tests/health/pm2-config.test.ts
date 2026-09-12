import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const configPath = resolve(process.cwd(), 'ops/pm2/ecosystem.config.cjs');

function loadConfig(environment: Record<string, string>) {
  return spawnSync(process.execPath, ['-e', 'console.log(JSON.stringify(require(process.argv[1])))', configPath], {
    encoding: 'utf8',
    env: { NODE_ENV: 'test', PATH: process.env.PATH ?? '', PM2_CWD: '', PM2_NODE_BIN: '', ...environment },
  });
}

describe('production PM2 topology', () => {
  it('fails closed without absolute validated interpreter and release cwd inputs', () => {
    const invalidRuntimeEnvironments: Record<string, string>[] = [
      {},
      { PM2_NODE_BIN: 'node', PM2_CWD: '/srv/botanica-ob/releases/candidate' },
      { PM2_NODE_BIN: '/opt/node24/bin/node', PM2_CWD: 'current' },
    ];

    for (const environment of invalidRuntimeEnvironments) {
      const result = loadConfig(environment);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('PM2_NODE_BIN and PM2_CWD must be absolute paths.');
    }
  });

  it('uses only the explicitly supplied interpreter and candidate cwd', () => {
    const result = loadConfig({
      PM2_CWD: '/srv/botanica-ob/releases/candidate',
      PM2_NODE_BIN: '/opt/node24/bin/node',
    });
    const [app] = JSON.parse(result.stdout).apps;

    expect(result.status, result.stderr).toBe(0);
    expect(app).toMatchObject({
      name: 'botanica-ob',
      cwd: '/srv/botanica-ob/releases/candidate',
      interpreter: '/opt/node24/bin/node',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --hostname 127.0.0.1',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: { NODE_ENV: 'production', PORT: 3000 },
    });
  });
});
