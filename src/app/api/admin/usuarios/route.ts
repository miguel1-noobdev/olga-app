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
import { isAllowedMutationOriginRequest } from '@/lib/auth/request-security';
import {
  assertAllowedKeys,
  enumValue,
  getSafeInputError,
  isPersistenceInputError,
  objectId,
  readJsonObject,
  RuntimeInputError,
} from '@/lib/validation/runtime-input';

const USER_ROLES = ['suscriptora', 'productora', 'admin'] as const;
const ACCOUNT_STATUSES = ['active', 'suspended'] as const;

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
  if (!isAllowedMutationOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let input: AdminUserMutationInput;
  try {
    const body = await readJsonObject(request);
    assertAllowedKeys(body, ['userId', 'role', 'accountStatus', 'confirmed']);
    const userId = objectId(body.userId, 'user id');
    if (typeof body.confirmed !== 'boolean') {
      throw new RuntimeInputError('Invalid request');
    }
    const role = body.role === undefined ? undefined : enumValue(body.role, 'role', USER_ROLES);
    const accountStatus = body.accountStatus === undefined
      ? undefined
      : enumValue(body.accountStatus, 'account status', ACCOUNT_STATUSES);
    if (role === undefined && accountStatus === undefined) {
      throw new RuntimeInputError('Invalid request');
    }
    input = { userId, role, accountStatus, confirmed: body.confirmed };
  } catch (error) {
    const failure = getSafeInputError(error, 'Invalid request');
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }

  try {
    await connectToDatabase();
    const users = createUserRepository();
    const audit = createAdministrativeAuditRepository();
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
    if (isPersistenceInputError(error)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    throw error;
  }
}
