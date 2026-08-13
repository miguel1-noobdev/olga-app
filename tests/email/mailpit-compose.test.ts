import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const compose = readFileSync(resolve(process.cwd(), 'docker-compose.yml'), 'utf8');

describe('local Mailpit Compose contract', () => {
  it('lets Compose assign project-scoped container names', () => {
    expect(compose).not.toContain('container_name:');
  });

  it('keeps MongoDB, SMTP, and the Mailpit API on loopback', () => {
    expect(compose).toContain('"127.0.0.1:27017:27017"');
    expect(compose).toMatch(
      /  mailpit:\n    image: axllent\/mailpit:v1\.30\.7\n    restart: unless-stopped\n    ports:\n      - "127\.0\.0\.1:1025:1025"\n      - "127\.0\.0\.1:8025:8025"/
    );
  });

  it('uses Mailpit readiness for its local healthcheck', () => {
    expect(compose).toMatch(
      /healthcheck:\n      test: \["CMD", "\/mailpit", "readyz"\]\n      interval: 15s\n      timeout: 5s\n      retries: 5\n      start_period: 10s/
    );
  });
});
