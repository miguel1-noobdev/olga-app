import { afterEach, describe, expect, it, vi } from 'vitest';

const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
const originalGoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

async function getProviderIds(clientId?: string, clientSecret?: string) {
  vi.resetModules();

  if (clientId === undefined) {
    delete process.env.GOOGLE_CLIENT_ID;
  } else {
    process.env.GOOGLE_CLIENT_ID = clientId;
  }

  if (clientSecret === undefined) {
    delete process.env.GOOGLE_CLIENT_SECRET;
  } else {
    process.env.GOOGLE_CLIENT_SECRET = clientSecret;
  }

  const { authOptions } = await import('@/lib/auth/options');
  return authOptions.providers.map((provider) => provider.id);
}

afterEach(() => {
  vi.resetModules();

  if (originalGoogleClientId === undefined) {
    delete process.env.GOOGLE_CLIENT_ID;
  } else {
    process.env.GOOGLE_CLIENT_ID = originalGoogleClientId;
  }

  if (originalGoogleClientSecret === undefined) {
    delete process.env.GOOGLE_CLIENT_SECRET;
  } else {
    process.env.GOOGLE_CLIENT_SECRET = originalGoogleClientSecret;
  }
});

describe('Google provider production policy', () => {
  it('does not register Google when both credentials are complete', async () => {
    await expect(getProviderIds('google-client-id', 'google-client-secret')).resolves.toEqual([
      'credentials',
    ]);
  });

  it('keeps credentials login when both Google credentials are absent', async () => {
    await expect(getProviderIds()).resolves.toEqual(['credentials']);
  });

  it('keeps credentials login when Google credentials are blank', async () => {
    await expect(getProviderIds('  ', '\t')).resolves.toEqual(['credentials']);
  });

  it('keeps credentials login when only one Google credential is configured', async () => {
    await expect(getProviderIds('google-client-id')).resolves.toEqual(['credentials']);
  });
});
