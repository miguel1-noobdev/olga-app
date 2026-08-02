import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { createUserRepository } from '@/lib/db/repository/user';
import { getClientIp } from '@/lib/auth/client-ip';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { isResendCoolingDown, issueVerificationEmail, normalizeRegistrationEmail } from '@/lib/auth/registration';
import { createEmailSender } from '@/lib/email/sender';

const RESPONSE = { message: 'If the address can be registered, a verification email will be sent.' };

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const email = typeof body.email === 'string' ? normalizeRegistrationEmail(body.email) : '';
    const ip = getClientIp(request.headers);
    const allowed = await Promise.all([
      consumeRateLimit({ subject: 'email', key: email || 'invalid-email', limit: 5 }),
      consumeRateLimit({ subject: 'ip', key: ip, limit: 20 }),
    ]);
    if (!allowed.every(Boolean)) return NextResponse.json(RESPONSE, { status: 429 });

    const user = email ? await createUserRepository().findByEmail(email) : null;
    if (user?.accountStatus === 'pending_email' && !(await isResendCoolingDown(user.id))) {
      await issueVerificationEmail(user, createEmailSender());
    }
    return NextResponse.json(RESPONSE, { status: 202 });
  } catch {
    return NextResponse.json({ message: 'Registration could not be completed.' }, { status: 503 });
  }
}
