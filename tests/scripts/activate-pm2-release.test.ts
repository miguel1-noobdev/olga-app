import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/activate-pm2-release.sh');
const candidateSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const rollbackSha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function run(...arguments_: string[]) {
  return spawnSync('bash', [scriptPath, ...arguments_], { encoding: 'utf8' });
}

describe('PM2 immutable release activation', () => {
  it('requires distinct caller-supplied full lowercase candidate and rollback Git SHAs', () => {
    for (const arguments_ of [[], ['not-a-sha', rollbackSha], [candidateSha], [candidateSha, candidateSha], ['A'.repeat(40), rollbackSha]]) {
      const result = run(...arguments_);

      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toContain('Distinct full 40-character lowercase candidate and rollback Git SHAs are required.');
    }
  });

  it('derives the candidate target from its valid caller-supplied SHA and rejects an unprepared release', () => {
    const result = run(candidateSha, rollbackSha);

    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain(`Prepared immutable release is unavailable: ${candidateSha}`);
  });

  it('does not embed a historical release ID in the activation interface', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('readonly CANDIDATE_SHA="${1:-}"');
    expect(source).toContain('readonly ROLLBACK_SHA="${2:-}"');
    expect(source).not.toContain('b050790d8dc7ab9638dd74217c18cd770043401f');
  });
});
