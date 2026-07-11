import type { Role } from '@/lib/db/models/user';

/**
 * Canonical role values used across the application.
 *
 * Olga's private laboratory access is locked to the `productora` role.
 * Miguel's admin access is locked to the `admin` role.
 * Public registered users receive the `suscriptora` role.
 */
export const ROLES = {
  SUSCRIPTORA: 'suscriptora',
  PRODUCTORA: 'productora',
  ADMIN: 'admin',
} as const satisfies Record<string, Role>;

export type StaffRole = typeof ROLES.PRODUCTORA | typeof ROLES.ADMIN;

export function isProductora(role: string): role is typeof ROLES.PRODUCTORA {
  return role === ROLES.PRODUCTORA;
}

export function isAdmin(role: string): role is typeof ROLES.ADMIN {
  return role === ROLES.ADMIN;
}

export function isStaff(role: string): role is StaffRole {
  return isProductora(role) || isAdmin(role);
}
