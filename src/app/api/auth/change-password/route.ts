import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { createUserRepository } from '@/lib/db/repository/user';
import { getCurrentUser } from '@/lib/auth/current-user';
import { changePassword } from '@/lib/auth/recovery';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });

  try {
    const body = await request.json();
    if (typeof body?.currentPassword !== 'string' || typeof body?.newPassword !== 'string') {
      return NextResponse.json({ message: 'Password change could not be completed.' }, { status: 400 });
    }

    await connectToDatabase();
    const success = await changePassword(
      createUserRepository(),
      user,
      body.currentPassword,
      body.newPassword,
    );
    if (!success) {
      return NextResponse.json({ message: 'Password change could not be completed.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password updated.' });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Password must be at least')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Password change could not be completed.' }, { status: 400 });
  }
}
