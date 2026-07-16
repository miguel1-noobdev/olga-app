import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isAdmin } from '@/lib/auth/roles';
import { getHealthReport } from '@/lib/admin/health';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(await getHealthReport());
}
