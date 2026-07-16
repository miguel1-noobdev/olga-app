import { describe, expect, it } from 'vitest';
import {
  approvedDirectoryUser,
  canApplyRoleChange,
  canApplyStatusChange,
  type AdminUserRecord,
} from '@/lib/admin/users/role-change';

const user: AdminUserRecord = {
  id: 'user-1',
  email: 'reader@example.com',
  role: 'suscriptora',
  accountStatus: 'active',
  createdAt: '2026-07-16T00:00:00.000Z',
  passwordHash: 'must-never-leak',
};

describe('admin user role changes', () => {
  it('projects only approved directory fields', () => {
    expect(approvedDirectoryUser(user)).toEqual({
      id: 'user-1',
      email: 'reader@example.com',
      role: 'suscriptora',
      accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z',
    });
  });

  it('permits a confirmed role change and rejects cancellation', () => {
    expect(canApplyRoleChange({ role: 'productora', confirmed: true })).toBe(true);
    expect(canApplyRoleChange({ role: 'productora', confirmed: false })).toBe(false);
    expect(canApplyRoleChange({ role: 'owner' as never, confirmed: true })).toBe(false);
  });

  it('allows only confirmed active or suspended access statuses', () => {
    expect(canApplyStatusChange({ accountStatus: 'suspended', confirmed: true })).toBe(true);
    expect(canApplyStatusChange({ accountStatus: 'deleted', confirmed: true })).toBe(false);
    expect(canApplyStatusChange({ accountStatus: 'active', confirmed: false })).toBe(false);
  });
});
