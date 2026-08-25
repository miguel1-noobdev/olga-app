import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('Node 24 migration archive structure', () => {
  it('runs the readable Python archive parser cases', () => {
    const result = spawnSync('/usr/bin/python3', ['-B', 'tests/scripts/node24_migration_archive_cases.py'], {
      cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    });
    expect(result.status, result.stderr).toBe(0);
  });
});
