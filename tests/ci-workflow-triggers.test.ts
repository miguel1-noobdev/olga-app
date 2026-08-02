import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci.yml'), 'utf8');

describe('CI workflow triggers', () => {
  it('runs for pull requests targeting every branch while limiting pushes to main branches', () => {
    expect(workflow).toMatch(/^  push:\n    branches: \[main, master\]$/m);
    expect(workflow).toMatch(/^  pull_request:\n\njobs:/m);
    expect(workflow).not.toMatch(/^  pull_request:\n    branches:/m);
  });

  it('provides a loopback-only Mailpit service and waits for it to become ready', () => {
    const mailpitService = workflow.match(
      /      mailpit:\n(?<config>(?:        .*\n)+?)\n    steps:/,
    )?.groups?.config;

    expect(mailpitService).toMatch(/^        image: axllent\/mailpit:latest$/m);
    expect(mailpitService).toMatch(/^        ports:\n          - 127\.0\.0\.1:1025:1025\n          - 127\.0\.0\.1:8025:8025$/m);
    expect(mailpitService?.match(/^          - .+$/gm)).toEqual([
      '          - 127.0.0.1:1025:1025',
      '          - 127.0.0.1:8025:8025',
    ]);
    expect(mailpitService).toContain('--health-cmd "/mailpit readyz"');
    expect(mailpitService).toContain('--health-interval 5s');
    expect(mailpitService).toContain('--health-timeout 3s');
    expect(mailpitService).toContain('--health-retries 12');
  });
});
