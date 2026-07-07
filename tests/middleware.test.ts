import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: vi.fn((url: URL) => ({ type: 'redirect', url: url.toString() })),
    next: vi.fn(() => ({ type: 'next' })),
  },
}));

const { getTokenMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}));

import { middleware, config } from '@/middleware';

function createMockRequest(path: string): NextRequest {
  const url = new URL(`http://localhost:3000${path}`);
  return {
    nextUrl: url,
    url: url.toString(),
  } as NextRequest;
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('matcher config', () => {
    it('protects /blog and /jardin-digital routes', () => {
      expect(config.matcher).toContain('/blog/:path*');
      expect(config.matcher).toContain('/jardin-digital/:path*');
    });
  });

  describe('unauthenticated requests', () => {
    it('redirects to /login for protected /blog routes', async () => {
      getTokenMock.mockResolvedValue(null);

      const request = createMockRequest('/blog');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/blog');
    });

    it('redirects to /login for protected /jardin-digital routes', async () => {
      getTokenMock.mockResolvedValue(null);

      const request = createMockRequest('/jardin-digital');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/jardin-digital');
    });

    it('redirects to /login for nested protected routes', async () => {
      getTokenMock.mockResolvedValue(null);

      const request = createMockRequest('/jardin-digital/lavanda');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/jardin-digital/lavanda');
    });

    it('preserves query string in callbackUrl', async () => {
      getTokenMock.mockResolvedValue(null);

      const request = createMockRequest('/blog?page=2');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/blog?page=2');
    });
  });

  describe('authenticated requests', () => {
    it('allows access to /blog when authenticated', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });

      const request = createMockRequest('/blog');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('allows access to /jardin-digital when authenticated', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });

      const request = createMockRequest('/jardin-digital');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });
  });
});
