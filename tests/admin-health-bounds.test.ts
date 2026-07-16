import { afterEach, describe, expect, it, vi } from 'vitest';
import { runBoundedHealthCheck } from '@/lib/admin/health/types';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runBoundedHealthCheck', () => {
  it('converts thrown probe failures to an unavailable check and logs no failure value', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(
      runBoundedHealthCheck(
        'mongo',
        async () => {
          throw new Error('mongodb://user:password@internal-host');
        },
        { pingReachedServer: false, authenticated: false }
      )
    ).resolves.toEqual({
      state: 'unavailable',
      details: { pingReachedServer: false, authenticated: false },
    });

    expect(warning).toHaveBeenCalledWith('Admin health probe unavailable', {
      probe: 'mongo',
      state: 'unavailable',
      elapsedMs: expect.any(Number),
    });
    expect(JSON.stringify(warning.mock.calls)).not.toContain('mongodb://user:password@internal-host');
  });
});
