import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { createUserRepository } from '@/lib/db/repository/user';
import { verifyPendingAccount } from '@/lib/auth/registration';

const FAILURE = { message: 'Verification could not be completed.' };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.accountId !== 'string' || typeof body.token !== 'string') {
      return NextResponse.json(FAILURE, { status: 400 });
    }
    await connectToDatabase();
    const verified = await verifyPendingAccount(
      createUserRepository(),
      body.accountId,
      body.token,
    );
    return verified
      ? NextResponse.json({ message: 'Email verification completed.' })
      : NextResponse.json(FAILURE, { status: 400 });
  } catch {
    return NextResponse.json(FAILURE, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountId = url.searchParams.get('accountId');
  const token = url.searchParams.get('token');

  if (!accountId || !token) {
    return NextResponse.redirect(new URL('/login?verified=false', request.url), 303);
  }

  try {
    await connectToDatabase();
    const verified = await verifyPendingAccount(createUserRepository(), accountId, token);
    return NextResponse.redirect(
      new URL(verified ? '/login?verified=true' : '/login?verified=false', request.url),
      303,
    );
  } catch {
    return NextResponse.redirect(new URL('/login?verified=false', request.url), 303);
  }
}
