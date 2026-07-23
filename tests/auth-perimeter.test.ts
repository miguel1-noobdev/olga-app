import { describe, expect, it } from 'vitest';
import {
  CREDENTIALS_LOGIN_RATE_LIMIT,
  MemoryRateLimiter,
  getClientIp,
  isAllowedSameOriginRequest,
} from '@/lib/auth/request-security';

describe('MemoryRateLimiter', () => {
  it('allows up to the configured limit and returns deterministic retry metadata', () => {
    let now = 1_000;
    const limiter = new MemoryRateLimiter({ maxEntries: 10, now: () => now });
    const policy = { limit: 2, windowMs: 1_000 };

    expect(limiter.consume('client-a', policy).allowed).toBe(true);
    now = 1_100;
    expect(limiter.consume('client-a', policy).allowed).toBe(true);

    const blocked = limiter.consume('client-a', policy);

    expect(blocked).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });

  it('expires old entries and evicts keys when the memory bound is reached', () => {
    let now = 0;
    const limiter = new MemoryRateLimiter({ maxEntries: 2, now: () => now });
    const policy = { limit: 1, windowMs: 100 };

    limiter.consume('client-a', policy);
    limiter.consume('client-b', policy);
    now = 1;
    expect(limiter.consume('client-c', policy)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
    expect(limiter.consume('client-a', policy).allowed).toBe(false);
    expect(limiter.size).toBe(2);

    now = 101;
    limiter.consume('client-d', policy);
    expect(limiter.size).toBe(1);
  });

  it('keeps the credentials policy explicit', () => {
    expect(CREDENTIALS_LOGIN_RATE_LIMIT).toEqual({
      limit: 10,
      windowMs: 15 * 60 * 1_000,
    });
  });
});

describe('same-origin validation', () => {
  function createRequest(url: string, origin?: string): Request {
    const headers = new Headers(origin ? { Origin: origin } : undefined);
    return { url, headers } as Request;
  }

  it('allows a same-origin request', () => {
    const request = createRequest('https://app.example/api/auth/register', 'https://app.example');

    expect(isAllowedSameOriginRequest(request)).toBe(true);
  });

  it('allows an explicitly configured trusted public origin', () => {
    const request = createRequest(
      'http://127.0.0.1:3000/api/auth/register',
      'https://app.example'
    );

    expect(isAllowedSameOriginRequest(request, 'https://app.example')).toBe(true);
  });

  it('rejects a mismatched or invalid explicit origin', () => {
    const mismatched = createRequest(
      'https://app.example/api/auth/register',
      'https://attacker.example'
    );
    const invalid = createRequest('https://app.example/api/auth/register', 'null');

    expect(isAllowedSameOriginRequest(mismatched)).toBe(false);
    expect(isAllowedSameOriginRequest(invalid)).toBe(false);
  });

  it('allows requests without an explicit Origin for compatibility with non-browser clients', () => {
    const request = createRequest('https://app.example/api/auth/register');

    expect(isAllowedSameOriginRequest(request)).toBe(true);
  });
});

describe('getClientIp', () => {
  it('uses a stable fallback unless forwarded headers are explicitly trusted', () => {
    const headers = {
      'x-forwarded-for': '203.0.113.10, 10.0.0.2',
      'x-real-ip': '10.0.0.3',
    };

    expect(getClientIp(headers)).toBe('unknown');
    expect(getClientIp(headers, true)).toBe('203.0.113.10');
  });

  it('falls back to a shared unknown key when no address is available', () => {
    expect(getClientIp(undefined)).toBe('unknown');
  });
});
