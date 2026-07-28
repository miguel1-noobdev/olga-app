import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('production PM2 topology', () => {
  it('runs one loopback-bound Next.js process from the current release', () => {
    const config = require('../../ops/pm2/ecosystem.config.cjs') as {
      apps: Array<{
        name: string;
        cwd: string;
        script: string;
        args: string;
        instances: number;
        exec_mode: string;
        watch: boolean;
        env: Record<string, string | number>;
      }>;
    };
    const [app] = config.apps;

    expect(app).toMatchObject({
      name: 'botanica-ob',
      cwd: '/srv/botanica-ob/current',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --hostname 127.0.0.1',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    });
  });
});
