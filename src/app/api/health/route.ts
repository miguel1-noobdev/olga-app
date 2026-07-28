import { NextResponse } from 'next/server';
import { checkMongoHealth } from '@/lib/admin/health/probes/mongo';
import { HEALTH_TIMEOUT_MS } from '@/lib/admin/health/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const unavailableResponse = { status: 'unavailable' } as const;

function respond(status: 200 | 503, body: { status: 'ok' | 'unavailable' }) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET() {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const health = await Promise.race([
      checkMongoHealth(HEALTH_TIMEOUT_MS),
      new Promise<Awaited<ReturnType<typeof checkMongoHealth>>>((resolve) => {
        timeout = setTimeout(
          () => resolve({ state: 'unavailable', details: { pingReachedServer: false, authenticated: false } }),
          HEALTH_TIMEOUT_MS
        );
      }),
    ]);

    const ready =
      health.state === 'ready' &&
      health.details.pingReachedServer &&
      health.details.authenticated;

    return ready ? respond(200, { status: 'ok' }) : respond(503, unavailableResponse);
  } catch {
    return respond(503, unavailableResponse);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
