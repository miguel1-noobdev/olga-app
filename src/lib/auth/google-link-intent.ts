import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { GoogleLinkIntentModel } from '@/lib/db/models/google-link-intent';

const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_LINK_INTENT_TTL_MS = 10 * 60 * 1000;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_IV_BYTES = 12;

export interface IssueGoogleLinkIntentInput {
  accountId: string;
  securityVersion: number;
  clientId: string;
  callbackUrl: string;
  now?: Date;
}

export interface IssuedGoogleLinkIntent {
  authorizationUrl: string;
  expiresAt: Date;
}

function base64UrlRandom(bytes: number): string {
  return randomBytes(bytes).toString('base64url');
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('base64url');
}

export function hashGoogleLinkState(state: string): string {
  return sha256(state);
}

function getEncryptionKey(env: NodeJS.ProcessEnv = process.env): Buffer {
  const encodedKey = env.GOOGLE_LINK_INTENT_ENCRYPTION_KEY;
  if (!encodedKey) {
    throw new Error('Google link intent encryption is unavailable');
  }

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) {
    throw new Error('Google link intent encryption is unavailable');
  }

  return key;
}

function encryptCodeVerifier(codeVerifier: string, key: Buffer): string {
  const iv = randomBytes(ENCRYPTION_IV_BYTES);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(codeVerifier, 'utf8'), cipher.final()]);

  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

async function replaceActiveGoogleLinkIntent(intent: {
  accountId: string;
  securityVersion: number;
  stateHash: string;
  nonce: string;
  codeChallenge: string;
  encryptedCodeVerifier: string;
  expiresAt: Date;
}): Promise<void> {
  await GoogleLinkIntentModel.init();

  for (;;) {
    try {
      await GoogleLinkIntentModel.findOneAndUpdate(
        { accountId: intent.accountId, consumedAt: null },
        { $set: intent },
        { upsert: true, returnDocument: 'after' },
      );
      return;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }
  }
}

export function decryptGoogleLinkCodeVerifier(encryptedCodeVerifier: string): string {
  const [encodedIv, encodedTag, encodedCiphertext] = encryptedCodeVerifier.split('.');
  if (!encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error('Google link intent encryption is unavailable');
  }

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), Buffer.from(encodedIv, 'base64url'));
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export async function issueGoogleLinkIntent({
  accountId,
  securityVersion,
  clientId,
  callbackUrl,
  now = new Date(),
}: IssueGoogleLinkIntentInput): Promise<IssuedGoogleLinkIntent> {
  const state = base64UrlRandom(32);
  const nonce = base64UrlRandom(32);
  const codeVerifier = base64UrlRandom(48);
  const expiresAt = new Date(now.getTime() + GOOGLE_LINK_INTENT_TTL_MS);
  const codeChallenge = sha256(codeVerifier);

  await replaceActiveGoogleLinkIntent({
    accountId,
    securityVersion,
    stateHash: hashGoogleLinkState(state),
    nonce,
    codeChallenge,
    encryptedCodeVerifier: encryptCodeVerifier(codeVerifier, getEncryptionKey()),
    expiresAt,
  });

  const authorizationUrl = new URL(AUTHORIZATION_ENDPOINT);
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', callbackUrl);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', 'openid email profile');
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('nonce', nonce);
  authorizationUrl.searchParams.set('code_challenge', codeChallenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');

  return { authorizationUrl: authorizationUrl.toString(), expiresAt };
}

export async function findActiveGoogleLinkIntent(state: string, now = new Date()) {
  return GoogleLinkIntentModel.findOne({
    stateHash: hashGoogleLinkState(state),
    consumedAt: null,
    expiresAt: { $gt: now },
  }).select('+encryptedCodeVerifier');
}
