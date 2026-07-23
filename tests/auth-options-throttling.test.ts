import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CredentialsConfig } from 'next-auth/providers/credentials';
import type { RequestInternal } from 'next-auth';
import {
  CREDENTIALS_LOGIN_RATE_LIMIT,
  credentialsLoginRateLimiter,
} from '@/lib/auth/request-security';

const { connectToDatabaseMock, authorizeWithRepositoryMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  authorizeWithRepositoryMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/auth/authorize-credentials', () => ({
  authorizeWithRepository: authorizeWithRepositoryMock,
}));

vi.mock('@/lib/db/repository/user', () => ({
  createUserRepository: vi.fn(),
}));

describe('credentials authorize throttling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    credentialsLoginRateLimiter.clear();
    process.env.TRUSTED_PROXY_HEADERS = 'true';
    connectToDatabaseMock.mockResolvedValue(undefined);
    authorizeWithRepositoryMock.mockResolvedValue({
      id: 'user-1',
      email: 'olga@botanicaob.com',
      role: 'suscriptora',
    });
  });

  afterEach(() => {
    delete process.env.TRUSTED_PROXY_HEADERS;
    vi.unstubAllEnvs();
  });

  const request = {
    headers: { 'x-forwarded-for': '203.0.113.11' },
  } as Pick<RequestInternal, 'headers'>;

  it('returns null and skips repository access after the per-IP limit', async () => {
    const { authOptions } = await import('@/lib/auth/options');
    const provider = authOptions.providers.find((candidate) => candidate.id === 'credentials');
    expect(provider).toBeDefined();
    const authorize = (provider as unknown as { options: CredentialsConfig }).options.authorize;

    for (let index = 0; index < CREDENTIALS_LOGIN_RATE_LIMIT.limit; index += 1) {
      await authorize({ email: 'olga@botanicaob.com', password: 'secret123' }, request as RequestInternal);
    }

    const blocked = await authorize(
      { email: 'olga@botanicaob.com', password: 'secret123' },
      request as RequestInternal
    );

    expect(blocked).toBeNull();
    expect(credentialsLoginRateLimiter.size).toBe(1);
    expect(authorizeWithRepositoryMock).toHaveBeenCalledTimes(CREDENTIALS_LOGIN_RATE_LIMIT.limit);
  });

  it('returns the normal credentials failure when production lacks trusted proxy configuration', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.TRUSTED_PROXY_HEADERS;
    const { authOptions } = await import('@/lib/auth/options');
    const provider = authOptions.providers.find((candidate) => candidate.id === 'credentials');
    const authorize = (provider as unknown as { options: CredentialsConfig }).options.authorize;

    const result = await authorize({ email: 'olga@botanicaob.com', password: 'secret123' }, request as RequestInternal);

    expect(result).toBeNull();
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });
});
