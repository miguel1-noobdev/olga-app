import { describe, expect, it } from 'vitest';
import { authOptions } from '@/lib/auth/options';

describe('NextAuth lifecycle claims', () => {
  it('copies verification and security-version state into JWT and session', async () => {
    const jwt = await authOptions.callbacks!.jwt!({
      token: {} as never,
      user: { id: 'user-1', email: 'reader@example.test', role: 'suscriptora', emailVerified: true, securityVersion: 4 } as never,
      account: null, profile: undefined, trigger: 'signIn',
    });
    expect(jwt).toMatchObject({ id: 'user-1', role: 'suscriptora', emailVerified: true, securityVersion: 4 });
    const session = await authOptions.callbacks!.session!({
      session: { expires: '2099-01-01T00:00:00.000Z', user: { id: 'user-1', role: 'suscriptora', emailVerified: true, securityVersion: 4, name: null, email: 'reader@example.test', image: null } },
      token: jwt, user: {} as never, newSession: false, trigger: 'update',
    });
    expect(session.user).toMatchObject({ emailVerified: true, securityVersion: 4 });
  });
});
