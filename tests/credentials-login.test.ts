import { describe, it, expect, vi } from 'vitest';
import { performCredentialsLogin } from '@/lib/auth/credentials-login';

describe('performCredentialsLogin', () => {
  it('calls signIn with credentials provider, redirect:false, and the sanitized callbackUrl', async () => {
    const signInMock = vi.fn().mockResolvedValue({ ok: true, error: null });

    await performCredentialsLogin(signInMock, 'a@b.com', 'pw', '/blog?page=2');

    expect(signInMock).toHaveBeenCalledWith('credentials', {
      email: 'a@b.com',
      password: 'pw',
      callbackUrl: '/blog?page=2',
      redirect: false,
    });
  });

  it('returns ok:true with navigateTo set to callbackUrl when signIn succeeds', async () => {
    const signInMock = vi.fn().mockResolvedValue({ ok: true, error: null });

    const result = await performCredentialsLogin(signInMock, 'a@b.com', 'pw', '/blog?page=2');

    expect(result).toEqual({ ok: true, navigateTo: '/blog?page=2' });
  });

  it('returns ok:false with the signIn error when credentials are rejected', async () => {
    const signInMock = vi.fn().mockResolvedValue({ ok: false, error: 'CredentialsSignin' });

    const result = await performCredentialsLogin(signInMock, 'a@b.com', 'wrong', '/blog');

    expect(result).toEqual({ ok: false, error: 'CredentialsSignin' });
  });

  it('returns ok:false with "unknown" when signIn returns a falsy result', async () => {
    const signInMock = vi.fn().mockResolvedValue(undefined);

    const result = await performCredentialsLogin(signInMock, 'a@b.com', 'pw', '/');

    expect(result).toEqual({ ok: false, error: 'unknown' });
  });

  it('propagates the callbackUrl as-is (sanitization is the caller responsibility)', async () => {
    const signInMock = vi.fn().mockResolvedValue({ ok: true, error: null });

    await performCredentialsLogin(signInMock, 'a@b.com', 'pw', '/jardin-digital/lavanda#top');

    expect(signInMock).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({ callbackUrl: '/jardin-digital/lavanda#top' }),
    );
  });
});
