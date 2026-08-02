import { afterEach, describe, expect, it, vi } from 'vitest';

const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
const originalGoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const originalGoogleOAuthEnabled = process.env.GOOGLE_OAUTH_ENABLED;

async function getProviderIds(
  clientId?: string,
  clientSecret?: string,
  oauthEnabled = 'false',
) {
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

  process.env.GOOGLE_OAUTH_ENABLED = oauthEnabled;

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

  if (originalGoogleOAuthEnabled === undefined) {
    delete process.env.GOOGLE_OAUTH_ENABLED;
  } else {
    process.env.GOOGLE_OAUTH_ENABLED = originalGoogleOAuthEnabled;
  }
});

describe('Google provider production policy', () => {
  it('registers Google only when the explicit release flag and both credentials are complete', async () => {
    await expect(getProviderIds('google-client-id', 'google-client-secret', 'true')).resolves.toEqual([
      'credentials',
      'google',
    ]);
  });

  it('keeps credentials login when both Google credentials are absent', async () => {
    await expect(getProviderIds()).resolves.toEqual(['credentials']);
  });

  it('keeps credentials login when Google credentials are blank', async () => {
    await expect(getProviderIds('  ', '\t')).resolves.toEqual(['credentials']);
  });

  it('keeps credentials login when only one Google credential is configured', async () => {
    await expect(getProviderIds('google-client-id', undefined, 'true')).resolves.toEqual(['credentials']);
  });

  it('keeps credentials login when the release flag is absent', async () => {
    await expect(getProviderIds('google-client-id', 'google-client-secret')).resolves.toEqual(['credentials']);
  });
});
