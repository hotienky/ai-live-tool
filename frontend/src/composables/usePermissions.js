/**
 * RBAC permission composable for tenant CMS.
 * Integrates with backend permission system.
 *
 * Usage:
 *   const { can, hasRole, isSuperAdmin, permissions } = usePermissions()
 *   if (can('products.edit')) { ... }
 *   if (hasRole('manager')) { ... }
 */
import { ref, computed } from 'vue'

// Reactive refs shared across composable instances
const userPermissions = ref(JSON.parse(localStorage.getItem('user_permissions') || '[]'))
const userRole = ref(JSON.parse(localStorage.getItem('user_role') || 'null'))

/**
 * Set permissions from login/me response
 */
export function setPermissions(permissions, role) {
  userPermissions.value = Array.isArray(permissions) ? permissions : []
  userRole.value = role || null
  localStorage.setItem('user_permissions', JSON.stringify(userPermissions.value))
  localStorage.setItem('user_role', JSON.stringify(userRole.value))
}

/**
 * Clear permissions (on logout)
 */
export function clearPermissions() {
  userPermissions.value = []
  userRole.value = null
  localStorage.removeItem('user_permissions')
  localStorage.removeItem('user_role')
}

/**
 * Auto-fetch permissions from /api/auth/me if user is logged in but has empty permissions.
 * This handles cases where the login response didn't include permissions (e.g. older backend version).
 */
let _fetchingPermissions = false
export async function fetchPermissionsIfEmpty() {
  const token = localStorage.getItem('auth_token')
  if (!token || token === 'undefined' || token === 'null') return
  if (userPermissions.value && userPermissions.value.length > 0) return
  if (_fetchingPermissions) return
  _fetchingPermissions = true
  try {
    const { apiFetch } = await import('./useApi.js')
    const res = await apiFetch('/auth/me')
    const data = await res.json()
    if (data && Array.isArray(data.permissions)) {
      setPermissions(data.permissions, data.user?.role || null)
    }
  } catch (e) {
    console.warn('[Permissions] Failed to auto-fetch:', e.message)
  } finally {
    _fetchingPermissions = false
  }
}

export function usePermissions() {
  const permissions = computed(() => userPermissions.value)
  const role = computed(() => userRole.value)
  const isSuperAdmin = computed(() => userPermissions.value.includes('*'))

  /**
   * Check if user has specific permission.
   * Supports:
   *  - Direct match: 'products.edit'
   *  - Super admin: '*'
   *  - Module wildcard: user has 'products.*' → matches 'products.edit'
   *  - Action wildcard: user has '*.view' → matches 'products.view'
   */
  function can(permission) {
    const perms = userPermissions.value
    if (!perms || perms.length === 0) return false

    // Super admin
    if (perms.includes('*')) return true

    // Direct match
    if (perms.includes(permission)) return true

    // Module wildcard: check if perms has 'module.*'
    const [module, action] = permission.split('.')
    if (module && perms.includes(`${module}.*`)) return true

    // Action wildcard: check if perms has '*.action'
    if (action && perms.includes(`*.${action}`)) return true

    return false
  }

  /**
   * Check if user can do ANY of the given permissions
   */
  function canAny(...perms) {
    return perms.some(p => can(p))
  }

  /**
   * Check if user has specific role
   */
  function hasRole(roleName) {
    return userRole.value?.name === roleName
  }

  return {
    permissions,
    role,
    isSuperAdmin,
    can,
    canAny,
    hasRole,
  }
}
