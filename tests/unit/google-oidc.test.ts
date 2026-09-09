// @vitest-environment node

import { generateKeyPairSync } from 'node:crypto';
import { SignJWT } from 'jose';
import { describe, expect, it, vi } from 'vitest';
import {
  exchangeAndVerifyGoogleIdToken,
  verifyGoogleIdToken,
} from '@/lib/auth/google-oidc';

const GOOGLE_CLIENT_ID = 'test-client-id';
const GOOGLE_ISSUER = 'https://accounts.google.com';

async function signedGoogleIdToken(
  overrides: Record<string, unknown> = {},
  audience: string | string[] = GOOGLE_CLIENT_ID,
): Promise<{
  idToken: string;
  publicKey: ReturnType<typeof generateKeyPairSync>['publicKey'];
}> {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const claims = {
    sub: 'google-subject-1',
    email: 'owner@example.test',
    email_verified: true,
    nonce: 'stored-nonce',
    ...overrides,
  };
  const idToken = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setIssuer(GOOGLE_ISSUER)
    .setAudience(audience)
    .setExpirationTime('5m')
    .sign(privateKey);

  return { idToken, publicKey };
}

function localJwks(key: ReturnType<typeof generateKeyPairSync>['publicKey']) {
  return () => async () => key;
}

describe('Google OIDC code exchange', () => {
  it('posts the server-held PKCE verifier and accepts only a signed, current token with matching issuer, audience, and nonce', async () => {
    const { idToken, publicKey } = await signedGoogleIdToken();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ id_token: idToken }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(exchangeAndVerifyGoogleIdToken({
      code: 'authorization-code',
      codeVerifier: 'server-held-verifier',
      redirectUri: 'http://localhost/api/auth/link-google/callback',
      nonce: 'stored-nonce',
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: 'test-client-secret',
    }, {
      fetch: fetchMock,
      getJwks: localJwks(publicKey),
    })).resolves.toEqual({
      providerAccountId: 'google-subject-1',
      email: 'owner@example.test',
    });
    expect(fetchMock).toHaveBeenCalledWith('https://oauth2.googleapis.com/token', expect.objectContaining({
      method: 'POST',
      body: expect.any(URLSearchParams),
    }));
    expect((fetchMock.mock.calls[0][1]!.body as URLSearchParams).get('code_verifier')).toBe('server-held-verifier');
  });

  it.each([
    ['wrong nonce', { nonce: 'other-nonce' }],
    ['missing subject', { sub: '' }],
    ['unverified email', { email_verified: false }],
  ])('rejects a %s claim without returning a Google subject', async (_name, claims) => {
    const { idToken, publicKey } = await signedGoogleIdToken(claims);

    await expect(verifyGoogleIdToken({
      idToken,
      nonce: 'stored-nonce',
      clientId: GOOGLE_CLIENT_ID,
      getJwks: localJwks(publicKey),
    })).rejects.toThrow('Google ID token verification failed');
  });

  it('rejects invalid issuer, audience, signature, or expiry before claims are used', async () => {
    const { idToken: wrongIssuer, publicKey: issuerKey } = await signedGoogleIdToken({});
    const { idToken: wrongAudience, publicKey: audienceKey } = await signedGoogleIdToken({});
    const { idToken: expired, publicKey: expiryKey } = await signedGoogleIdToken({});
    const { idToken: signedByAnotherKey } = await signedGoogleIdToken();

    await expect(verifyGoogleIdToken({
      idToken: wrongIssuer,
      nonce: 'stored-nonce',
      clientId: GOOGLE_CLIENT_ID,
      issuer: 'https://issuer.invalid',
      getJwks: localJwks(issuerKey),
    })).rejects.toThrow('Google ID token verification failed');
    await expect(verifyGoogleIdToken({
      idToken: wrongAudience,
      nonce: 'stored-nonce',
      clientId: 'different-client-id',
      getJwks: localJwks(audienceKey),
    })).rejects.toThrow('Google ID token verification failed');
    await expect(verifyGoogleIdToken({
      idToken: signedByAnotherKey,
      nonce: 'stored-nonce',
      clientId: GOOGLE_CLIENT_ID,
      getJwks: localJwks(expiryKey),
    })).rejects.toThrow('Google ID token verification failed');
    await expect(verifyGoogleIdToken({
      idToken: expired,
      nonce: 'stored-nonce',
      clientId: GOOGLE_CLIENT_ID,
      getJwks: localJwks(expiryKey),
      currentDate: new Date(Date.now() + 10 * 60 * 1000),
    })).rejects.toThrow('Google ID token verification failed');
  });

  it.each([
    ['missing authorized party', {}],
    ['a different authorized party', { azp: 'another-client-id' }],
  ])('rejects a multi-audience token with %s', async (_name, claims) => {
    const { idToken, publicKey } = await signedGoogleIdToken(
      claims,
      [GOOGLE_CLIENT_ID, 'another-client-id'],
    );

    await expect(verifyGoogleIdToken({
      idToken,
      nonce: 'stored-nonce',
      clientId: GOOGLE_CLIENT_ID,
      getJwks: localJwks(publicKey),
    })).rejects.toThrow('Google ID token verification failed');
  });
});
