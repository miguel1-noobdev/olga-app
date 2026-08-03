import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { createUserRepository } from '@/lib/db/repository/user';
import { getClientIp } from '@/lib/auth/client-ip';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { createEmailSender } from '@/lib/email/sender';
import {
  GENERIC_RECOVERY_RESPONSE,
  issuePasswordResetEmail,
  normalizeRecoveryEmail,
} from '@/lib/auth/recovery';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body.email !== 'string' || !body.email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const email = normalizeRecoveryEmail(body.email);
    await connectToDatabase();
    const allowed = await Promise.all([
      consumeRateLimit({ subject: 'email', key: email, limit: 5 }),
      consumeRateLimit({ subject: 'ip', key: getClientIp(request.headers), limit: 20 }),
    ]);
    if (!allowed.every(Boolean)) return NextResponse.json(GENERIC_RECOVERY_RESPONSE, { status: 429 });

    const user = await createUserRepository().findByEmail(email);
    if (user && user.emailVerified && user.accountStatus !== 'pending_email') {
      await issuePasswordResetEmail(user, createEmailSender());
    }

    return NextResponse.json(GENERIC_RECOVERY_RESPONSE, { status: 202 });
  } catch {
    return NextResponse.json(
      { message: 'Recovery could not be completed.' },
      { status: 503 },
    );
  }
}
