import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  connectToDatabaseMock,
  findByEmailMock,
  issuePasswordResetEmailMock,
  resetPasswordWithTokenMock,
  changePasswordMock,
  getCurrentUserMock,
  createEmailSenderMock,
  consumeRateLimitMock,
} = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  findByEmailMock: vi.fn(),
  issuePasswordResetEmailMock: vi.fn(),
  resetPasswordWithTokenMock: vi.fn(),
  changePasswordMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  createEmailSenderMock: vi.fn(() => ({ send: vi.fn() })),
  consumeRateLimitMock: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectToDatabaseMock }));
vi.mock('@/lib/db/repository/user', () => ({
  createUserRepository: vi.fn(() => ({ findByEmail: findByEmailMock })),
}));
vi.mock('@/lib/auth/recovery', () => ({
  GENERIC_RECOVERY_RESPONSE: { message: 'If the account exists, a recovery email will be sent.' },
  normalizeRecoveryEmail: (email: string) => email.trim().toLowerCase(),
  issuePasswordResetEmail: issuePasswordResetEmailMock,
  resetPasswordWithToken: resetPasswordWithTokenMock,
  changePassword: changePasswordMock,
}));
vi.mock('@/lib/email/sender', () => ({ createEmailSender: createEmailSenderMock }));
vi.mock('@/lib/auth/rate-limit', () => ({ consumeRateLimit: consumeRateLimitMock }));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));

import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as resetPassword } from '@/app/api/auth/reset-password/route';
import { POST as changePassword } from '@/app/api/auth/change-password/route';

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/auth/recovery', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('account recovery routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimitMock.mockResolvedValue(true);
    createEmailSenderMock.mockReturnValue({ send: vi.fn() });
  });

  it('uses the same generic recovery response for known and unknown addresses', async () => {
    findByEmailMock.mockResolvedValueOnce({
      id: 'user-1',
      email: 'reader@example.com',
      accountStatus: 'active',
      emailVerified: true,
      role: 'suscriptora',
      securityVersion: 0,
    });
    findByEmailMock.mockResolvedValueOnce(null);

    const known = await forgotPassword(jsonRequest({ email: 'Reader@Example.com' }));
    const unknown = await forgotPassword(jsonRequest({ email: 'unknown@example.com' }));

    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(await known.json()).toEqual(await unknown.json());
    expect(issuePasswordResetEmailMock).toHaveBeenCalledTimes(1);
    expect(issuePasswordResetEmailMock.mock.calls[0][0]).toMatchObject({ id: 'user-1' });
  });

  it('rejects a replayed reset token without changing the account twice', async () => {
    resetPasswordWithTokenMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const first = await resetPassword(jsonRequest({
      accountId: 'user-1',
      token: 'one-time-token',
      password: 'new-password-123',
    }));
    const replay = await resetPassword(jsonRequest({
      accountId: 'user-1',
      token: 'one-time-token',
      password: 'new-password-123',
    }));

    expect(first.status).toBe(200);
    expect(replay.status).toBe(400);
    expect(await replay.json()).toEqual({ message: 'Password reset could not be completed.' });
    expect(resetPasswordWithTokenMock).toHaveBeenCalledTimes(2);
  });

  it('changes an authenticated staff password without changing its role or status', async () => {
    getCurrentUserMock.mockResolvedValue({
      id: 'staff-1',
      email: 'olga@example.com',
      role: 'productora',
      accountStatus: 'active',
      emailVerified: true,
      securityVersion: 3,
    });
    changePasswordMock.mockResolvedValue(true);

    const response = await changePassword(jsonRequest({
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'Password updated.' });
    expect(changePasswordMock).toHaveBeenCalledWith(
      expect.objectContaining({ findByEmail: findByEmailMock }),
      expect.objectContaining({ id: 'staff-1', role: 'productora', accountStatus: 'active' }),
      'old-password',
      'new-password-123',
    );
  });

  it('fails closed when a recovery request reaches its durable limit', async () => {
    consumeRateLimitMock.mockResolvedValueOnce(false);

    const response = await forgotPassword(jsonRequest({ email: 'reader@example.com' }));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      message: 'If the account exists, a recovery email will be sent.',
    });
    expect(findByEmailMock).not.toHaveBeenCalled();
  });
});
