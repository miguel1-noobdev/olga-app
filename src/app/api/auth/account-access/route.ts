import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { createUserRepository } from '@/lib/db/repository/user';

export const runtime = 'nodejs';

const ACCOUNT_CHECK_SIGNATURE_HEADER = 'x-account-check-signature';
const USER_ID_HEADER = 'x-user-id';

function hasValidAccountCheckSignature(request: NextRequest): boolean {
  const expected = process.env.NEXTAUTH_SECRET;
  const supplied = request.headers.get(ACCOUNT_CHECK_SIGNATURE_HEADER);
  const userId = request.headers.get(USER_ID_HEADER);

  if (!expected || !supplied || !userId) {
    return false;
  }

  const expectedSignature = createHmac('sha256', expected).update(userId).digest('hex');
  const expectedBuffer = Uint8Array.from(Buffer.from(expectedSignature));
  const suppliedBuffer = Uint8Array.from(Buffer.from(supplied));

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

export async function GET(request: NextRequest) {
  if (!hasValidAccountCheckSignature(request)) {
    return new NextResponse(null, { status: 404 });
  }

  const userId = request.headers.get(USER_ID_HEADER);

  if (!userId) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    await connectToDatabase();
    const user = await createUserRepository().findById(userId);

    if (!user || user.accountStatus !== 'active') {
      return new NextResponse(null, { status: 403 });
    }

    return NextResponse.json({ role: user.role }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
