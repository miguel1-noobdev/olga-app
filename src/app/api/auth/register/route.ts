import { NextResponse } from 'next/server';
import { createUserRepository } from '@/lib/db/repository/user';
import { connectToDatabase } from '@/lib/db/connect';
import { getClientIp } from '@/lib/auth/client-ip';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { createEmailSender } from '@/lib/email/sender';
import { issueVerificationEmail, normalizeRegistrationEmail } from '@/lib/auth/registration';

const RESPONSE = { message: 'If the address can be registered, a verification email will be sent.' };

function isDuplicateEmailError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('already exists') ||
      (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000))
  );
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeRegistrationEmail(email);
    const ip = getClientIp(request.headers);
    const allowed = await Promise.all([
      consumeRateLimit({ subject: 'email', key: normalizedEmail, limit: 5 }),
      consumeRateLimit({ subject: 'ip', key: ip, limit: 20 }),
    ]);
    if (!allowed.every(Boolean)) return NextResponse.json(RESPONSE, { status: 429 });

    const repo = createUserRepository();
    const user = await repo.create({
      email: normalizedEmail,
      password,
      accountStatus: 'pending_email',
      emailVerified: false,
    });
    try {
      await issueVerificationEmail(user, createEmailSender());
    } catch (error) {
      await repo.deletePendingRegistration(user.id);
      throw error;
    }

    return NextResponse.json(RESPONSE, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';

    if (isDuplicateEmailError(error)) {
      return NextResponse.json(RESPONSE, { status: 202 });
    }

    if (message.includes('Password must be at least')) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    if (message.includes('Invalid email')) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    const status = message.includes('Email delivery') ? 503 : 500;
    return NextResponse.json({ message: status === 503 ? 'Registration could not be completed.' : 'Registration failed' }, { status });
  }
}
