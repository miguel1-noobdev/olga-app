import { NextResponse } from 'next/server';
import { createUserRepository } from '@/lib/db/repository/user';
import { connectToDatabase } from '@/lib/db/connect';

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

    const repo = createUserRepository();
    await repo.create({ email, password });

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

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
