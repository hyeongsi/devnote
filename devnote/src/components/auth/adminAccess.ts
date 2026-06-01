import type { AuthUser } from '../../types';

export function isAdminUser(user: AuthUser | null): boolean {
  return user?.role === 'ROLE_ADMIN';
}
