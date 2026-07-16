import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSessionMock, getCurrentUserMock, reviewMock, publishMock, unpublishMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  reviewMock: vi.fn(),
  publishMock: vi.fn(),
  unpublishMock: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));
vi.mock('@/lib/db/repository/article', () => ({
  createArticleRepository: vi.fn(() => ({ review: reviewMock, publish: publishMock, unpublish: unpublishMock })),
}));

import { PATCH } from '@/app/api/admin/articles/[id]/route';

describe('PATCH /api/admin/articles/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects non-Admin lifecycle mutations', async () => {
    getCurrentUserMock.mockResolvedValue({ role: 'suscriptora' });

    const response = await PATCH(new Request('http://localhost/api/admin/articles/a1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'publish' }),
    }), { params: { id: 'a1' } });

    expect(response.status).toBe(403);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('reviews, publishes, and unpublishes only the selected article', async () => {
    getCurrentUserMock.mockResolvedValue({ role: 'admin' });

    for (const action of ['review', 'publish', 'unpublish']) {
      const response = await PATCH(new Request('http://localhost/api/admin/articles/a1', {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }), { params: { id: 'a1' } });

      expect(response.status).toBe(200);
    }

    expect(reviewMock).toHaveBeenCalledWith('a1');
    expect(publishMock).toHaveBeenCalledWith('a1');
    expect(unpublishMock).toHaveBeenCalledWith('a1');
  });
});
