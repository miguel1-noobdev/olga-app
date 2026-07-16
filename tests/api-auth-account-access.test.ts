import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { connectToDatabaseMock, findByIdMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  findByIdMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/db/repository/user', () => ({
  createUserRepository: () => ({ findById: findByIdMock }),
}));

import { GET } from '@/app/api/auth/account-access/route';

const secret = 'test-secret';

function createInternalRequest(userId: string) {
  const signature = createHmac('sha256', secret).update(userId).digest('hex');

  return new NextRequest('http://localhost:3000/api/auth/account-access', {
    headers: {
      'x-account-check-signature': signature,
      'x-user-id': userId,
    },
  });
}

describe('GET /api/auth/account-access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = secret;
  });

  it('returns only the current role for an active internally verified account', async () => {
    findByIdMock.mockResolvedValue({ accountStatus: 'active', role: 'productora' });

    const response = await GET(createInternalRequest('user-1'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ role: 'productora' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('rejects invalid signatures and never reads the account', async () => {
    const response = await GET(new NextRequest('http://localhost:3000/api/auth/account-access'));

    expect(response.status).toBe(404);
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('fails closed without returning a database error', async () => {
    connectToDatabaseMock.mockRejectedValue(new Error('database connection details'));

    const response = await GET(createInternalRequest('user-1'));

    expect(response.status).toBe(503);
    expect(await response.text()).toBe('');
  });
});
