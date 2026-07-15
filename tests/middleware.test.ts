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
    it('protects /blog, /jardin-digital, /laboratorio and /admin routes', () => {
      expect(config.matcher).toContain('/blog/:path*');
      expect(config.matcher).toContain('/jardin-digital/:path*');
      expect(config.matcher).toContain('/laboratorio/:path*');
      expect(config.matcher).toContain('/admin/:path*');
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

    it('redirects to /login for protected /laboratorio routes', async () => {
      getTokenMock.mockResolvedValue(null);

      const request = createMockRequest('/laboratorio');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/laboratorio');
    });

    it('redirects to /login for nested /laboratorio routes', async () => {
      getTokenMock.mockResolvedValue(null);

      const request = createMockRequest('/laboratorio/formulas');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/laboratorio/formulas');
    });

    it('redirects to /login for protected /admin routes', async () => {
      getTokenMock.mockResolvedValue(null);

      const request = createMockRequest('/admin');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/admin');
    });

    it('redirects to /login for nested /admin routes', async () => {
      getTokenMock.mockResolvedValue(null);

      const request = createMockRequest('/admin/blog/nuevo');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/admin/blog/nuevo');
    });
  });

  describe('authenticated requests', () => {
    it('allows access to /blog when authenticated', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'suscriptora' });

      const request = createMockRequest('/blog');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('allows access to /jardin-digital when authenticated', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'suscriptora' });

      const request = createMockRequest('/jardin-digital');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('redirects authenticated non-staff users away from /laboratorio', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'suscriptora' });

      const request = createMockRequest('/laboratorio');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('redirects authenticated non-staff users away from nested /laboratorio routes', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'suscriptora' });

      const request = createMockRequest('/laboratorio/formulas');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('allows access to /laboratorio for productora role', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'olga@test.com', role: 'productora' });

      const request = createMockRequest('/laboratorio');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('allows access to /laboratorio for admin role', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'admin@test.com', role: 'admin' });

      const request = createMockRequest('/laboratorio');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('redirects authenticated non-admin users away from /admin', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'reader@test.com', role: 'suscriptora' });

      const request = createMockRequest('/admin');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('redirects productora users away from /admin', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'olga@test.com', role: 'productora' });

      const request = createMockRequest('/admin/blog');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('allows access to /admin for admin role', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'admin@test.com', role: 'admin' });

      const request = createMockRequest('/admin');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('allows access to nested /admin routes for admin role', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'admin@test.com', role: 'admin' });

      const request = createMockRequest('/admin/blog/nuevo');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });
  });
});
