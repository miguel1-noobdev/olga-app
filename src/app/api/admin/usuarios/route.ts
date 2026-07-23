import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { approvedDirectoryUser } from '@/lib/admin/users/role-change';
import { createAdministrativeAuditRepository } from '@/lib/admin/users/activity';
import {
  applyGuardedAdminUserMutation,
  type AdminUserMutationInput,
} from '@/lib/admin/users/guarded-mutation';
import { connectToDatabase } from '@/lib/db/connect';
import {
  MongoLeaseLockUnavailableError,
  withMongoLeaseLock,
} from '@/lib/db/mongo-lease-lock';
import { createUserRepository } from '@/lib/db/repository/user';

async function getAdminSession() {
  const user = await getCurrentUser();
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectToDatabase();
  const users = await createUserRepository().findAll();
  return NextResponse.json({ users: users.map(approvedDirectoryUser) });
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: unknown = await request.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid mutation' }, { status: 400 });
  }

  const { userId, role, accountStatus, confirmed } = body as Record<string, unknown>;
  if (typeof userId !== 'string' || typeof confirmed !== 'boolean') {
    return NextResponse.json({ error: 'Invalid mutation' }, { status: 400 });
  }

  await connectToDatabase();
  const users = createUserRepository();
  const audit = createAdministrativeAuditRepository();

  const input: AdminUserMutationInput = { userId, role, accountStatus, confirmed };
  try {
    const outcome = await withMongoLeaseLock((guard) => applyGuardedAdminUserMutation(
      input,
      session.id,
      { users, audit, assertOwnership: () => guard.assertOwnership() },
    ));
    return NextResponse.json(outcome.body, { status: outcome.status });
  } catch (error) {
    if (error instanceof MongoLeaseLockUnavailableError) {
      return NextResponse.json({ error: 'Administrative mutation temporarily unavailable' }, { status: 503 });
    }
    throw error;
  }
}
