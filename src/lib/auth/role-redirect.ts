import { ROLES } from './roles';

/**
 * Default post-login destinations by role.
 *
 * - productora lands in the laboratory workspace.
 * - admin lands in the admin dashboard.
 * - suscriptora lands on the public landing when there is no explicit
 *   callbackUrl context; callers must preserve a safe callbackUrl first.
 */
export const DEFAULT_REDIRECTS = {
  PRODUCTORA: '/laboratorio',
  ADMIN: '/admin',
  SUSCRIPTORA: '/',
} as const;

/**
 * Returns the default redirect path for a given role.
 * Falls back to '/' for missing or unknown roles so callers never hand
 * an ambiguous destination to the router.
 */
export function getDefaultRedirectForRole(role: string | undefined): string {
  switch (role) {
    case ROLES.PRODUCTORA:
      return DEFAULT_REDIRECTS.PRODUCTORA;
    case ROLES.ADMIN:
      return DEFAULT_REDIRECTS.ADMIN;
    case ROLES.SUSCRIPTORA:
      return DEFAULT_REDIRECTS.SUSCRIPTORA;
    default:
      return '/';
  }
}
