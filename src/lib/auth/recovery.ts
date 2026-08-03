import { randomBytes } from 'node:crypto';
import { AuthEventModel } from '@/lib/db/models/auth-event';
import { AuthTokenModel, consumeAuthToken, hashAuthToken } from '@/lib/db/models/auth-token';
import type { UserRecord, UserRepository } from '@/lib/db/repository/user';
import type { EmailSender } from '@/lib/email/sender';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

export const GENERIC_RECOVERY_RESPONSE = {
  message: 'If the account exists, a recovery email will be sent.',
} as const;

export function normalizeRecoveryEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateRecoveryPassword(password: string): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

function recoveryUrlOrigin(environment: NodeJS.ProcessEnv = process.env): string {
  try {
    const url = new URL(environment.NEXTAUTH_URL ?? '');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Invalid recovery URL origin.');
    }
    return url.origin;
  } catch {
    throw new Error('Email delivery configuration is unavailable.');
  }
}

export async function issuePasswordResetEmail(
  user: UserRecord,
  sender: EmailSender,
  now = new Date(),
): Promise<void> {
  const rawToken = randomBytes(32).toString('hex');
  await AuthTokenModel.deleteMany({ accountId: user.id, purpose: 'password_reset' });
  await AuthTokenModel.create({
    accountId: user.id,
    purpose: 'password_reset',
    tokenHash: hashAuthToken(rawToken),
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
    securityVersion: user.securityVersion,
  });

  const url = new URL('/reset-password', recoveryUrlOrigin());
  url.searchParams.set('accountId', user.id);
  url.searchParams.set('token', rawToken);

  try {
    await sender.send({ to: user.email, template: 'recover', tokenUrl: url.toString() });
  } catch (error) {
    await AuthTokenModel.deleteMany({
      accountId: user.id,
      purpose: 'password_reset',
      tokenHash: hashAuthToken(rawToken),
    });
    throw new Error('Email delivery failed.', { cause: error });
  }
}

async function recordRecoveryEvent(input: {
  accountId?: string;
  event: string;
  outcome: 'success' | 'failure' | 'denied';
  metadata?: Record<string, string | number | boolean>;
}): Promise<void> {
  await AuthEventModel.create(input);
}

async function revokeAccountSessions(repo: UserRepository, user: UserRecord): Promise<void> {
  await repo.advanceSecurityVersion(user.id);
  await AuthTokenModel.deleteMany({ accountId: user.id });
}

export async function resetPasswordWithToken(
  repo: UserRepository,
  accountId: string,
  rawToken: string,
  newPassword: string,
  now = new Date(),
): Promise<boolean> {
  validateRecoveryPassword(newPassword);
  const user = await repo.findById(accountId);
  if (!user) return false;

  const consumed = await consumeAuthToken({
    accountId,
    purpose: 'password_reset',
    rawToken,
    now,
    securityVersion: user.securityVersion,
  });
  if (!consumed) {
    await recordRecoveryEvent({ accountId, event: 'password_reset', outcome: 'denied' });
    return false;
  }

  await repo.updatePassword(user.id, newPassword);
  await revokeAccountSessions(repo, user);
  await recordRecoveryEvent({ accountId: user.id, event: 'password_reset', outcome: 'success' });
  return true;
}

export async function changePassword(
  repo: UserRepository,
  user: UserRecord,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  validateRecoveryPassword(newPassword);
  if (!(await repo.verifyPassword(user, currentPassword))) {
    await recordRecoveryEvent({ accountId: user.id, event: 'password_change', outcome: 'denied' });
    return false;
  }

  await repo.updatePassword(user.id, newPassword);
  await revokeAccountSessions(repo, user);
  await recordRecoveryEvent({ accountId: user.id, event: 'password_change', outcome: 'success' });
  return true;
}

export interface StaffRecoveryResult {
  id: string;
  role: 'productora' | 'admin';
  accountStatus: UserRecord['accountStatus'];
  securityVersion: number;
}

export async function recoverStaffAccount(
  repo: UserRepository,
  userId: string,
  newPassword: string,
): Promise<StaffRecoveryResult> {
  validateRecoveryPassword(newPassword);
  const user = await repo.findById(userId);
  if (!user || (user.role !== 'productora' && user.role !== 'admin')) {
    throw new Error('Staff account not found.');
  }

  await repo.updatePassword(user.id, newPassword);
  await revokeAccountSessions(repo, user);
  await recordRecoveryEvent({
    accountId: user.id,
    event: 'staff_account_recovery',
    outcome: 'success',
    metadata: { role: user.role },
  });

  return {
    id: user.id,
    role: user.role,
    accountStatus: user.accountStatus,
    securityVersion: user.securityVersion + 1,
  };
}
