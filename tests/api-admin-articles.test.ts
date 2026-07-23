import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, connectMock, createMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  connectMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectMock }));
vi.mock('@/lib/db/repository/article', () => ({
  createArticleRepository: vi.fn(() => ({ create: createMock })),
}));

import { POST } from '@/app/api/admin/articles/route';

function requestWithOrigin(url: string, init: RequestInit, origin = 'http://localhost'): Request {
  const request = new Request(url, init);
  const headers = new Headers(init.headers);
  headers.set('Origin', origin);
  Object.defineProperty(request, 'headers', { value: headers });
  return request;
}

describe('POST /api/admin/articles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost');
    createMock.mockResolvedValue({ id: 'article-1' });
  });

  afterEach(() => vi.unstubAllEnvs());

  it('creates an article for an Admin with an explicit same-origin header', async () => {
    getCurrentUserMock.mockResolvedValue({ role: 'admin' });

    const response = await POST(requestWithOrigin('http://localhost/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Lavanda',
        category: 'Plantas',
        excerpt: 'Aromática',
        content: 'Contenido',
        image: '/img/lavanda.jpg',
        imageAlt: 'Lavanda',
      }),
    }));

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalled();
  });

  it('rejects a cross-origin mutation before authentication or database work', async () => {
    const response = await POST(requestWithOrigin('http://localhost/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify({}),
    }, 'https://attacker.example'));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Invalid request origin' });
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(connectMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });
});
