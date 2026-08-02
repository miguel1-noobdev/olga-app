import { randomBytes } from 'node:crypto';
import { AuthTokenModel, consumeAuthToken, hashAuthToken } from '@/lib/db/models/auth-token';
import type { UserRecord, UserRepository } from '@/lib/db/repository/user';
import type { EmailSender } from '@/lib/email/sender';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function normalizeRegistrationEmail(email: string): string {
  return email.trim().toLowerCase();
}

function verificationUrlOrigin(environment: NodeJS.ProcessEnv = process.env): string {
  try {
    const url = new URL(environment.NEXTAUTH_URL ?? '');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Invalid verification URL origin.');
    }
    return url.origin;
  } catch {
    throw new Error('Email delivery configuration is unavailable.');
  }
}

export async function issueVerificationEmail(
  user: UserRecord,
  sender: EmailSender,
  now = new Date(),
): Promise<void> {
  const rawToken = randomBytes(32).toString('hex');
  await AuthTokenModel.deleteMany({ accountId: user.id, purpose: 'email_verification' });
  await AuthTokenModel.create({
    accountId: user.id,
    purpose: 'email_verification',
    tokenHash: hashAuthToken(rawToken),
    expiresAt: new Date(now.getTime() + VERIFICATION_TTL_MS),
    securityVersion: user.securityVersion,
  });

  const url = new URL('/api/auth/verify', verificationUrlOrigin());
  url.searchParams.set('accountId', user.id);
  url.searchParams.set('token', rawToken);

  try {
    await sender.send({ to: user.email, template: 'verify', tokenUrl: url.toString() });
  } catch (error) {
    await AuthTokenModel.deleteMany({
      accountId: user.id,
      purpose: 'email_verification',
      tokenHash: hashAuthToken(rawToken),
    });
    throw new Error('Email delivery failed.', { cause: error });
  }
}

export async function isResendCoolingDown(accountId: string, now = new Date()): Promise<boolean> {
  const latest = await AuthTokenModel.findOne({
    accountId,
    purpose: 'email_verification',
  }).sort({ createdAt: -1 });
  return Boolean(latest && now.getTime() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS);
}

export async function verifyPendingAccount(
  repo: UserRepository,
  accountId: string,
  rawToken: string,
  now = new Date(),
): Promise<boolean> {
  const user = await repo.findById(accountId);
  if (!user || user.accountStatus !== 'pending_email' || user.emailVerified) return false;

  const consumed = await consumeAuthToken({
    accountId,
    purpose: 'email_verification',
    rawToken,
    now,
    securityVersion: user.securityVersion,
  });
  return consumed ? repo.markEmailVerified(accountId) : false;
}
