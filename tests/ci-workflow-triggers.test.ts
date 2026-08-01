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
});
