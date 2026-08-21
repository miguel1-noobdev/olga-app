import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authOptions } from '@/lib/auth/options';
import {
  GOOGLE_CREDENTIALS_FALLBACK,
  resolveGoogleCallbackResult,
} from '@/lib/auth/google';

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

  it('keeps the approved neutral collision fallback and rejects dangerous email linking', () => {
    expect(GOOGLE_CREDENTIALS_FALLBACK).toBe(
      'No pudimos completar el acceso con Google. Iniciá sesión con tu email y contraseña.',
    );
    expect(readFileSync(resolve(root, 'src/lib/auth/options.ts'), 'utf8')).not.toContain(
      'allowDangerousEmailAccountLinking',
    );
    expect(
      resolveGoogleCallbackResult({ providerIdentityFound: true, credentialsAccountFound: true }),
    ).toBe('sign_in');
    expect(
      resolveGoogleCallbackResult({ providerIdentityFound: false, credentialsAccountFound: true }),
    ).toBe('credentials_fallback');
    expect(
      resolveGoogleCallbackResult({ providerIdentityFound: false, credentialsAccountFound: false }),
    ).toBe('provision_new_subscriber');
  });
});
