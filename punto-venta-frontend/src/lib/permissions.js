import { useAuth } from '../contexts/AuthContext'

/**
 * Permission codes — must match exactly what the backend embeds in the JWT.
 * Update here if the backend changes its permission strings.
 */
export const PERMISSIONS = {
  PRODUCT_READ:    'PRODUCT_READ',
  PRODUCT_WRITE:   'PRODUCT_WRITE',
  INVENTORY_READ:  'INVENTORY_READ',
  INVENTORY_WRITE: 'INVENTORY_WRITE',
  SALE_CREATE:     'SALE_CREATE',
  SALE_CLOSE:      'SALE_CLOSE',
  REPORT_READ:     'REPORT_READ',
  USER_READ:       'USER_READ',
  USER_WRITE:      'USER_WRITE',
}

/**
 * Returns true if the user has the given permission code.
 * - null code → always returns true (accessible to all authenticated users)
 * - missing / null user → always returns false
 */
export function hasPermission(user, code) {
  if (code == null) return true
  if (!user) return false
  return Array.isArray(user.permissions) && user.permissions.includes(code)
}

/**
 * Hook version of hasPermission — reads user from AuthContext.
 * Usage: const canWrite = usePermission(PERMISSIONS.PRODUCT_WRITE)
 */
export function usePermission(code) {
  const { user } = useAuth()
  return hasPermission(user, code)
}
