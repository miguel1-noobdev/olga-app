import { ROLES } from '@/lib/auth/roles';
import type { Role } from '@/lib/db/models/user';

export type AccountStatus = 'active' | 'suspended';

export interface AdminUserRecord {
  id: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  createdAt: string;
  passwordHash: string;
}

export interface ApprovedDirectoryUser {
  id: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  createdAt: string;
}

const APPROVED_ACCOUNT_STATUSES: readonly AccountStatus[] = ['active', 'suspended'];
const APPROVED_ROLES: readonly Role[] = [ROLES.SUSCRIPTORA, ROLES.PRODUCTORA, ROLES.ADMIN];

export function approvedDirectoryUser(user: AdminUserRecord): ApprovedDirectoryUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  };
}

export function canApplyRoleChange(input: { role: string; confirmed: boolean }): input is {
  role: Role;
  confirmed: true;
} {
  return input.confirmed && APPROVED_ROLES.includes(input.role as Role);
}

export function canApplyStatusChange(input: {
  accountStatus: string;
  confirmed: boolean;
}): input is { accountStatus: AccountStatus; confirmed: true } {
  return input.confirmed && APPROVED_ACCOUNT_STATUSES.includes(input.accountStatus as AccountStatus);
}
