import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/activate-pm2-release.sh');
const releaseSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function run(...arguments_: string[]) {
  return spawnSync('bash', [scriptPath, ...arguments_], { encoding: 'utf8' });
}

describe('PM2 immutable release activation', () => {
  it('requires a caller-supplied full lowercase Git SHA', () => {
    for (const arguments_ of [[], ['not-a-sha']]) {
      const result = run(...arguments_);

      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toContain('A full 40-character lowercase Git SHA is required.');
    }
  });

  it('derives the target from a valid caller-supplied SHA and rejects an unprepared release', () => {
    const result = run(releaseSha);

    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain(`Prepared immutable release is unavailable: ${releaseSha}`);
  });

  it('does not embed a historical release ID in the activation interface', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('readonly RELEASE_ID="${1:-}"');
    expect(source).not.toContain('b050790d8dc7ab9638dd74217c18cd770043401f');
  });
});
