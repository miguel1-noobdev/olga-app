import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authOptions } from '@/lib/auth/options';

type PackageManifest = {
  dependencies: Record<string, string>;
};

const root = resolve(__dirname, '../..');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'package.json'), 'utf8')
) as PackageManifest;

describe('NextAuth compatibility contract', () => {
  it('keeps the patched v4 session and credentials contracts intact', () => {
    expect(manifest.dependencies['next-auth']).toBe('4.24.15');
    expect(authOptions.session?.strategy).toBe('jwt');
    expect(authOptions.pages?.signIn).toBe('/login');
    expect(authOptions.providers.some((provider) => provider.id === 'credentials')).toBe(true);
  });

  it('keeps the existing OAuth callback contract available to the auth module', () => {
    expect(typeof authOptions.callbacks?.signIn).toBe('function');
    expect(typeof authOptions.callbacks?.jwt).toBe('function');
    expect(typeof authOptions.callbacks?.session).toBe('function');
  });
});
