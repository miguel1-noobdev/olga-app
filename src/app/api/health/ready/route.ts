import { NextResponse } from 'next/server';
import { checkMongoHealth } from '@/lib/admin/health/probes/mongo';
import { HEALTH_TIMEOUT_MS } from '@/lib/admin/health/types';
import { resolveMongoUri } from '@/lib/db/connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function unavailableResponse() {
  return NextResponse.json(
    { status: 'unavailable' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  );
}

function hasRequiredRuntimeConfiguration(): boolean {
  try {
    resolveMongoUri();
  } catch {
    return false;
  }

  return Boolean(process.env.NEXTAUTH_SECRET?.trim());
}

export async function GET() {
  if (!hasRequiredRuntimeConfiguration()) {
    return unavailableResponse();
  }

  try {
    const mongo = await checkMongoHealth(HEALTH_TIMEOUT_MS);

    if (mongo.state !== 'ready') {
      return unavailableResponse();
    }

    return NextResponse.json(
      { status: 'ready' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return unavailableResponse();
  }
}
