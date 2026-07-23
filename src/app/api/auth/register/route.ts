import { NextResponse } from 'next/server';
import { createUserRepository } from '@/lib/db/repository/user';
import { connectToDatabase } from '@/lib/db/connect';
import {
  REGISTRATION_RATE_LIMIT,
  areTrustedProxyHeadersEnabled,
  getClientIp,
  isAllowedMutationOriginRequest,
  isAuthRateLimitingAvailable,
  registrationRateLimiter,
} from '@/lib/auth/request-security';
import {
  assertAllowedKeys,
  boundedString,
  getSafeInputError,
  isPersistenceInputError,
  readJsonObject,
  RuntimeInputError,
} from '@/lib/validation/runtime-input';

function isDuplicateEmailError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('already exists') ||
      (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000))
  );
}

export async function POST(request: Request) {
  if (!isAuthRateLimitingAvailable()) {
    return NextResponse.json(
      { error: 'Registration temporarily unavailable' },
      { status: 503 }
    );
  }

  if (!isAllowedMutationOriginRequest(request)) {
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }

  const rateLimit = registrationRateLimiter.consume(
    getClientIp(request.headers, areTrustedProxyHeadersEnabled()),
    REGISTRATION_RATE_LIMIT
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonObject(request);
    assertAllowedKeys(body, ['email', 'password']);
    if (body.email === undefined || body.password === undefined) {
      throw new RuntimeInputError('Email and password are required');
    }
    const email = boundedString(body.email, 'email', { maxLength: 254 });
    const password = boundedString(body.password, 'password', {
      maxLength: 128,
      trim: false,
    });
    if (password.length < 8) {
      throw new RuntimeInputError('Password must be at least 8 characters');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new RuntimeInputError('Invalid email format');
    }
    body = { email, password };
  } catch (error) {
    const failure = getSafeInputError(error, 'Invalid request');
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }

  try {
    await connectToDatabase();

    const repo = createUserRepository();
    await repo.create({ email: body.email as string, password: body.password as string });

    return NextResponse.json(
      { message: 'Registration request accepted' },
      { status: 202 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';

    if (isDuplicateEmailError(error)) {
      return NextResponse.json(
        { message: 'Registration request accepted' },
        { status: 202 }
      );
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

    if (isPersistenceInputError(error)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
