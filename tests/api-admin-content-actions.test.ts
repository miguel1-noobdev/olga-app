import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSessionMock, getCurrentUserMock, connectMock, reviewMock, publishMock, unpublishMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  connectMock: vi.fn(),
  reviewMock: vi.fn(),
  publishMock: vi.fn(),
  unpublishMock: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectMock }));
vi.mock('@/lib/db/repository/article', () => ({
  createArticleRepository: vi.fn(() => ({ review: reviewMock, publish: publishMock, unpublish: unpublishMock })),
}));

import { PATCH } from '@/app/api/admin/articles/[id]/route';

function requestWithOrigin(url: string, init: RequestInit, origin = 'http://localhost'): Request {
  const request = new Request(url, init);
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Origin', origin);
  Object.defineProperty(request, 'headers', { value: headers });
  return request;
}

describe('PATCH /api/admin/articles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('rejects non-Admin lifecycle mutations', async () => {
    getCurrentUserMock.mockResolvedValue({ role: 'suscriptora' });

    const response = await PATCH(requestWithOrigin('http://localhost/api/admin/articles/507f1f77bcf86cd799439011', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'publish' }),
    }), { params: { id: '507f1f77bcf86cd799439011' } });

    expect(response.status).toBe(403);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('reviews, publishes, and unpublishes only the selected article', async () => {
    getCurrentUserMock.mockResolvedValue({ role: 'admin' });

    for (const action of ['review', 'publish', 'unpublish']) {
      const response = await PATCH(requestWithOrigin('http://localhost/api/admin/articles/507f1f77bcf86cd799439011', {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }), { params: { id: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(200);
    }

    expect(reviewMock).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(publishMock).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(unpublishMock).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('rejects a cross-origin mutation before authentication or database work', async () => {
    const response = await PATCH(requestWithOrigin('http://localhost/api/admin/articles/507f1f77bcf86cd799439011', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'publish' }),
    }, 'https://attacker.example'), { params: { id: '507f1f77bcf86cd799439011' } });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Invalid request origin' });
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(connectMock).not.toHaveBeenCalled();
    expect(publishMock).not.toHaveBeenCalled();
  });
});
