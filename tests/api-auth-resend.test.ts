import { describe, expect, it, vi } from 'vitest';

const { connectToDatabaseMock, consumeRateLimitMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectToDatabaseMock }));
vi.mock('@/lib/auth/rate-limit', () => ({ consumeRateLimit: consumeRateLimitMock }));

import { POST as resend } from '@/app/api/auth/resend/route';

describe('/api/auth/resend POST', () => {
  it('connects to Mongo before consuming durable rate limits', async () => {
    connectToDatabaseMock.mockResolvedValue(undefined);
    consumeRateLimitMock.mockResolvedValue(true);

    const response = await resend(
      new Request('http://localhost/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(202);
    expect(consumeRateLimitMock).toHaveBeenCalledTimes(2);
    expect(connectToDatabaseMock.mock.invocationCallOrder[0]).toBeLessThan(
      consumeRateLimitMock.mock.invocationCallOrder[0],
    );
  });
});
