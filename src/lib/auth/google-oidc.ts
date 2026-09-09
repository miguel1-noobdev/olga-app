import { createRemoteJWKSet, jwtVerify } from 'jose';
import { normalizeGoogleEmail } from './google';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_ISSUER = 'https://accounts.google.com';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

const remoteGoogleJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

type GoogleJwks = Parameters<typeof jwtVerify>[1];

export interface GoogleOidcInput {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  nonce: string;
  clientId: string;
  clientSecret: string;
}

export interface VerifyGoogleIdTokenInput {
  idToken: string;
  nonce: string;
  clientId: string;
  issuer?: string;
  getJwks?: () => GoogleJwks | Promise<GoogleJwks>;
  currentDate?: Date;
}

export interface VerifiedGoogleIdToken {
  providerAccountId: string;
  email: string;
}

export interface GoogleOidcDependencies {
  fetch?: typeof fetch;
  getJwks?: () => GoogleJwks | Promise<GoogleJwks>;
}

export async function verifyGoogleIdToken({
  idToken,
  nonce,
  clientId,
  issuer = GOOGLE_ISSUER,
  getJwks = () => remoteGoogleJwks,
  currentDate,
}: VerifyGoogleIdTokenInput): Promise<VerifiedGoogleIdToken> {
  try {
    const { payload } = await jwtVerify(idToken, await getJwks(), {
      issuer,
      audience: clientId,
      algorithms: ['RS256'],
      currentDate,
    });

    if (
      (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== clientId) ||
      payload.nonce !== nonce ||
      typeof payload.sub !== 'string' ||
      !payload.sub.trim() ||
      payload.email_verified !== true ||
      typeof payload.email !== 'string' ||
      !payload.email.trim()
    ) {
      throw new Error('Invalid Google ID token claims');
    }

    return {
      providerAccountId: payload.sub,
      email: normalizeGoogleEmail(payload.email),
    };
  } catch {
    throw new Error('Google ID token verification failed');
  }
}

export async function exchangeAndVerifyGoogleIdToken(
  input: GoogleOidcInput,
  dependencies: GoogleOidcDependencies = {},
): Promise<VerifiedGoogleIdToken> {
  const fetchImplementation = dependencies.fetch ?? fetch;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    code_verifier: input.codeVerifier,
  });

  let idToken: string;
  try {
    const response = await fetchImplementation(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    const responseBody: unknown = await response.json();

    if (
      !response.ok ||
      typeof responseBody !== 'object' ||
      responseBody === null ||
      !('id_token' in responseBody) ||
      typeof responseBody.id_token !== 'string' ||
      !responseBody.id_token
    ) {
      throw new Error('Google code exchange failed');
    }
    idToken = responseBody.id_token;
  } catch {
    throw new Error('Google code exchange failed');
  }

  return verifyGoogleIdToken({
    idToken,
    nonce: input.nonce,
    clientId: input.clientId,
    getJwks: dependencies.getJwks,
  });
}
