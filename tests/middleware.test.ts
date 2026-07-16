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

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}));

import { middleware, config } from '@/middleware';

function createMockRequest(path: string, origin = 'http://localhost:3000'): NextRequest {
  const url = new URL(path, origin);
  return {
    nextUrl: url,
    url: url.toString(),
    headers: new Headers({ host: url.host }),
  } as NextRequest;
}

function mockActiveToken(role: 'suscriptora' | 'productora' | 'admin') {
  getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role });
  fetchMock.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ role }),
  });
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.INTERNAL_ACCOUNT_CHECK_ORIGIN = 'http://127.0.0.1:3000';
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
    it('uses the configured internal origin instead of a hostile request Host', async () => {
      mockActiveToken('admin');

      await middleware(createMockRequest('/admin', 'https://attacker.invalid'));

      const [accountCheckUrl] = fetchMock.mock.calls[0];
      expect(accountCheckUrl).toBeInstanceOf(URL);
      expect(accountCheckUrl.toString()).toBe('http://127.0.0.1:3000/api/auth/account-access');
    });

    it('uses a trusted HTTPS origin configured for the account check', async () => {
      process.env.INTERNAL_ACCOUNT_CHECK_ORIGIN = 'https://auth.botanica.example';
      mockActiveToken('suscriptora');

      await middleware(createMockRequest('/blog'));

      const [accountCheckUrl] = fetchMock.mock.calls[0];
      expect(accountCheckUrl.toString()).toBe('https://auth.botanica.example/api/auth/account-access');
    });

    it('fails closed without a valid configured account-check origin', async () => {
      delete process.env.INTERNAL_ACCOUNT_CHECK_ORIGIN;
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'admin' });

      await middleware(createMockRequest('/admin'));

      expect(fetchMock).not.toHaveBeenCalled();
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('fails closed when the configured account-check origin is not HTTPS or loopback', async () => {
      process.env.INTERNAL_ACCOUNT_CHECK_ORIGIN = 'http://auth.botanica.example';
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'admin' });

      await middleware(createMockRequest('/admin'));

      expect(fetchMock).not.toHaveBeenCalled();
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it.each(['/blog', '/jardin-digital', '/laboratorio', '/admin'])(
      'rejects a suspended user with an already-issued JWT from %s',
      async (path) => {
        getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'admin' });
        fetchMock.mockResolvedValue({ ok: false, json: vi.fn() });

        await middleware(createMockRequest(path));

        expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
        const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
        expect(redirectUrl.pathname).toBe('/');
      }
    );

    it('rejects a missing persisted user and database unavailability without leaking errors', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'suscriptora' });
      fetchMock.mockResolvedValue({ ok: false, json: vi.fn() });

      await middleware(createMockRequest('/blog'));

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('fails closed within one second when the account check does not respond', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'suscriptora' });
      let resolveFetchOptions: (options: RequestInit) => void;
      const fetchStarted = new Promise<RequestInit>((resolve) => {
        resolveFetchOptions = resolve;
      });

      fetchMock.mockImplementation((_url, options) => {
        resolveFetchOptions(options as RequestInit);

        return new Promise((_, reject) => {
          (options as RequestInit).signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          );
        });
      });

      const result = middleware(createMockRequest('/blog'));
      const options = await fetchStarted;

      expect(options.signal).toBeInstanceOf(AbortSignal);
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      expect(options.signal?.aborted).toBe(true);
      await result;

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('uses the persisted role instead of a stale JWT role for staff boundaries', async () => {
      getTokenMock.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'admin' });
      fetchMock.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ role: 'suscriptora' }),
      });

      await middleware(createMockRequest('/admin'));

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('allows access to /blog when authenticated', async () => {
      mockActiveToken('suscriptora');

      const request = createMockRequest('/blog');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('allows access to /jardin-digital when authenticated', async () => {
      mockActiveToken('suscriptora');

      const request = createMockRequest('/jardin-digital');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('redirects authenticated non-staff users away from /laboratorio', async () => {
      mockActiveToken('suscriptora');

      const request = createMockRequest('/laboratorio');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('redirects authenticated non-staff users away from nested /laboratorio routes', async () => {
      mockActiveToken('suscriptora');

      const request = createMockRequest('/laboratorio/formulas');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('allows access to /laboratorio for productora role', async () => {
      mockActiveToken('productora');

      const request = createMockRequest('/laboratorio');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('allows access to /laboratorio for admin role', async () => {
      mockActiveToken('admin');

      const request = createMockRequest('/laboratorio');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('redirects authenticated non-admin users away from /admin', async () => {
      mockActiveToken('suscriptora');

      const request = createMockRequest('/admin');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('redirects productora users away from /admin', async () => {
      mockActiveToken('productora');

      const request = createMockRequest('/admin/blog');
      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/');
    });

    it('allows access to /admin for admin role', async () => {
      mockActiveToken('admin');

      const request = createMockRequest('/admin');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });

    it('allows access to nested /admin routes for admin role', async () => {
      mockActiveToken('admin');

      const request = createMockRequest('/admin/blog/nuevo');
      const result = await middleware(request);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: 'next' });
    });
  });
});
