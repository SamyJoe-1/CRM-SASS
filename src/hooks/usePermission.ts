import { useAuthStore } from '../stores/authStore'

export function usePermission() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const isRole = useAuthStore((s) => s.isRole)
  const user = useAuthStore((s) => s.user)

  return {
    can: hasPermission,
    isRole,
    user,
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isHR: user?.role === 'hr_manager' || user?.role === 'admin' || user?.role === 'super_admin',
    isManager: ['super_admin', 'admin', 'hr_manager', 'manager'].includes(user?.role ?? ''),
  }
}
