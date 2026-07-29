import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config.mjs';

describe('Next image cache configuration', () => {
  it('disables the disk cache for immutable releases', () => {
    expect(nextConfig.images?.maximumDiskCacheSize).toBe(0);
  });
});
