import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { createUserRepository } from '@/lib/db/repository/user';
import { resetPasswordWithToken } from '@/lib/auth/recovery';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body.accountId !== 'string' ||
      typeof body.token !== 'string' ||
      typeof body.password !== 'string'
    ) {
      return NextResponse.json({ message: 'Password reset could not be completed.' }, { status: 400 });
    }

    await connectToDatabase();
    const success = await resetPasswordWithToken(
      createUserRepository(),
      body.accountId,
      body.token,
      body.password,
    );
    if (!success) {
      return NextResponse.json({ message: 'Password reset could not be completed.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password updated.' });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Password must be at least')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Password reset could not be completed.' }, { status: 400 });
  }
}
