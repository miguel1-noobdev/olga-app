import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import {
  canApplyRoleChange,
  canApplyStatusChange,
  approvedDirectoryUser,
  isLastActiveAdmin,
} from '@/lib/admin/users/role-change';
import {
  createAdministrativeAuditEvent,
  createAdministrativeAuditRepository,
} from '@/lib/admin/users/activity';
import { connectToDatabase } from '@/lib/db/connect';
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
  const directory = await users.findAll();
  const occurredAt = new Date().toISOString();

  if (typeof role === 'string') {
    const roleChange = { role, confirmed };
    if (canApplyRoleChange(roleChange)) {
      if (roleChange.role !== 'admin' && isLastActiveAdmin(directory, userId)) {
        return NextResponse.json({ error: 'Rejected mutation' }, { status: 400 });
      }
      if (userId === session.id && roleChange.role !== 'admin') {
        return NextResponse.json({ error: 'Rejected mutation' }, { status: 400 });
      }
      await users.updateRole(userId, roleChange.role);
      await audit.record(createAdministrativeAuditEvent({
        type: 'role_changed', subjectUserId: userId, actorUserId: session.id, occurredAt,
      }));
      return NextResponse.json({ success: true });
    }
  }

  if (typeof accountStatus === 'string') {
    const statusChange = { accountStatus, confirmed };
    if (canApplyStatusChange(statusChange)) {
      if (statusChange.accountStatus === 'suspended' && isLastActiveAdmin(directory, userId)) {
        return NextResponse.json({ error: 'Rejected mutation' }, { status: 400 });
      }
      if (userId === session.id && statusChange.accountStatus === 'suspended') {
        return NextResponse.json({ error: 'Rejected mutation' }, { status: 400 });
      }
      await users.updateAccountStatus(userId, statusChange.accountStatus);
      await audit.record(createAdministrativeAuditEvent({
        type: 'account_status_changed', subjectUserId: userId, actorUserId: session.id, occurredAt,
      }));
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: 'Rejected mutation' }, { status: 400 });
}
