import {
  canApplyRoleChange,
  canApplyStatusChange,
  isLastActiveAdmin,
} from '@/lib/admin/users/role-change';
import {
  createAdministrativeAuditEvent,
  type AdministrativeAuditRepository,
} from '@/lib/admin/users/activity';
import type { Role } from '@/lib/db/models/user';
import type { UserRepository, UserRecord } from '@/lib/db/repository/user';

export interface AdminUserMutationInput {
  userId: string;
  role?: unknown;
  accountStatus?: unknown;
  confirmed: boolean;
}

export interface GuardedAdminUserMutationOutcome {
  status: 200 | 400 | 500;
  body: { success?: true; error?: string };
}

interface MutationDependencies {
  users: Pick<UserRepository, 'findAll' | 'findById' | 'updateRole' | 'updateAccountStatus'>;
  audit: Pick<AdministrativeAuditRepository, 'record'>;
  assertOwnership: () => Promise<void>;
}

function auditFailureOutcome(message: string): GuardedAdminUserMutationOutcome {
  return { status: 500, body: { error: message } };
}

export async function applyGuardedAdminUserMutation(
  input: AdminUserMutationInput,
  actorUserId: string,
  dependencies: MutationDependencies,
): Promise<GuardedAdminUserMutationOutcome> {
  const directory = await dependencies.users.findAll();
  const foundUser = await dependencies.users.findById(input.userId);
  if (!foundUser) {
    return { status: 400, body: { error: 'User not found' } };
  }
  const previousUser: UserRecord = { ...foundUser };

  const occurredAt = new Date().toISOString();

  if (typeof input.role === 'string') {
    const roleChange = { role: input.role, confirmed: input.confirmed };
    if (canApplyRoleChange(roleChange)) {
      if (roleChange.role !== 'admin' && isLastActiveAdmin(directory, input.userId)) {
        return { status: 400, body: { error: 'Rejected mutation' } };
      }
      if (input.userId === actorUserId && roleChange.role !== 'admin') {
        return { status: 400, body: { error: 'Rejected mutation' } };
      }

      await dependencies.assertOwnership();
      await dependencies.users.updateRole(input.userId, roleChange.role);
      try {
        await dependencies.assertOwnership();
        await dependencies.audit.record(createAdministrativeAuditEvent({
          type: 'role_changed',
          subjectUserId: input.userId,
          actorUserId,
          occurredAt,
        }));
      } catch (auditError) {
        try {
          await dependencies.assertOwnership();
          await dependencies.users.updateRole(input.userId, previousUser.role as Role);
        } catch (rollbackError) {
          console.error('Audit failed and rollback failed:', auditError, rollbackError);
          return auditFailureOutcome(
            `Cambio aplicado pero auditoría falló. Estado actual: ${roleChange.role}. Error de auditoría. Error de rollback.`,
          );
        }
        return auditFailureOutcome(
          `Cambio revertido. La auditoría falló pero el rol fue restaurado a ${previousUser.role}.`,
        );
      }
      return { status: 200, body: { success: true } };
    }
  }

  if (typeof input.accountStatus === 'string') {
    const statusChange = { accountStatus: input.accountStatus, confirmed: input.confirmed };
    if (canApplyStatusChange(statusChange)) {
      if (statusChange.accountStatus === 'suspended' && isLastActiveAdmin(directory, input.userId)) {
        return { status: 400, body: { error: 'Rejected mutation' } };
      }
      if (input.userId === actorUserId && statusChange.accountStatus === 'suspended') {
        return { status: 400, body: { error: 'Rejected mutation' } };
      }

      await dependencies.assertOwnership();
      await dependencies.users.updateAccountStatus(input.userId, statusChange.accountStatus);
      try {
        await dependencies.assertOwnership();
        await dependencies.audit.record(createAdministrativeAuditEvent({
          type: 'account_status_changed',
          subjectUserId: input.userId,
          actorUserId,
          occurredAt,
        }));
      } catch (auditError) {
        try {
          await dependencies.assertOwnership();
          await dependencies.users.updateAccountStatus(input.userId, previousUser.accountStatus);
        } catch (rollbackError) {
          console.error('Audit failed and rollback failed:', auditError, rollbackError);
          return auditFailureOutcome(
            `Cambio aplicado pero auditoría falló. Estado actual: ${statusChange.accountStatus}. Error de auditoría. Error de rollback.`,
          );
        }
        return auditFailureOutcome(
          `Cambio revertido. La auditoría falló pero el estado fue restaurado a ${previousUser.accountStatus}.`,
        );
      }
      return { status: 200, body: { success: true } };
    }
  }

  return { status: 400, body: { error: 'Rejected mutation' } };
}
