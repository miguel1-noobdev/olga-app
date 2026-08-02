import { describe, expect, it } from 'vitest';
import { getClientIp } from '@/lib/auth/client-ip';

describe('getClientIp', () => {
  it('uses forwarded IP only for local Nginx', () =>
    expect(getClientIp(new Headers({ 'x-forwarded-for': '203.0.113.4, 127.0.0.1', 'x-trusted-proxy': 'local-nginx' }), '127.0.0.1')).toBe('203.0.113.4'));
  it('ignores forwarded IP from an untrusted proxy', () =>
    expect(getClientIp(new Headers({ 'x-forwarded-for': '203.0.113.4', 'x-trusted-proxy': 'external-proxy' }), '198.51.100.7')).toBe('198.51.100.7'));
  it('uses an anonymous fallback without a socket address', () => expect(getClientIp(new Headers())).toBe('unknown-client'));
});
