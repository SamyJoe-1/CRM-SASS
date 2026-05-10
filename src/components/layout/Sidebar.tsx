import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Clock, Calendar, DollarSign, FileText,
  BarChart3, Star, Target, Building2, Briefcase, Megaphone,
  Settings, Shield, Database, Globe, X, ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePermission } from '../../hooks/usePermission'
import { useUIStore } from '../../stores/uiStore'
import { useTranslation } from 'react-i18next'

interface NavItem {
  path: string
  icon: React.ReactNode
  labelKey: string
  permission?: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, labelKey: 'nav.dashboard' },
  { path: '/employees', icon: <Users className="h-4 w-4" />, labelKey: 'nav.employees', permission: 'employees.view' },
  { path: '/attendance', icon: <Clock className="h-4 w-4" />, labelKey: 'nav.attendance' },
  { path: '/leave', icon: <Calendar className="h-4 w-4" />, labelKey: 'nav.leave' },
  { path: '/payroll', icon: <DollarSign className="h-4 w-4" />, labelKey: 'nav.payroll', permission: 'payroll.view' },
  { path: '/payslips', icon: <FileText className="h-4 w-4" />, labelKey: 'nav.payslips' },
  { path: '/performance', icon: <Star className="h-4 w-4" />, labelKey: 'nav.performance' },
  { path: '/kpis', icon: <Target className="h-4 w-4" />, labelKey: 'nav.kpis' },
  { path: '/analytics', icon: <BarChart3 className="h-4 w-4" />, labelKey: 'nav.analytics', permission: 'analytics.view' },
  { path: '/departments', icon: <Building2 className="h-4 w-4" />, labelKey: 'nav.departments', permission: 'departments.view' },
  { path: '/positions', icon: <Briefcase className="h-4 w-4" />, labelKey: 'nav.positions', permission: 'positions.view' },
  { path: '/announcements', icon: <Megaphone className="h-4 w-4" />, labelKey: 'nav.announcements' },
]

const BOTTOM_ITEMS: NavItem[] = [
  { path: '/audit', icon: <Database className="h-4 w-4" />, labelKey: 'nav.audit', permission: 'audit.view' },
  { path: '/users', icon: <Shield className="h-4 w-4" />, labelKey: 'nav.users', permission: 'users.view' },
  { path: '/tenants', icon: <Globe className="h-4 w-4" />, labelKey: 'nav.tenants', roles: ['super_admin'] },
  { path: '/settings', icon: <Settings className="h-4 w-4" />, labelKey: 'nav.settings', permission: 'settings.view' },
]

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const { can, isRole } = usePermission()
  const { setSidebarOpen } = useUIStore()
  const { t } = useTranslation()
  const location = useLocation()

  function shouldShow(item: NavItem) {
    if (item.roles) return item.roles.some((r) => isRole(r))
    if (item.permission) return can(item.permission)
    return true
  }

  function NavItemEl({ item }: { item: NavItem }) {
    if (!shouldShow(item)) return null
    const isActive = location.pathname.startsWith(item.path)
    return (
      <NavLink
        to={item.path}
        onClick={() => mobile && setSidebarOpen(false)}
        className={cn(
          'nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
          isActive
            ? 'bg-[var(--color-sidebar-active)] text-white'
            : 'text-gray-400 hover:bg-[var(--color-sidebar-hover)] hover:text-white'
        )}
      >
        {item.icon}
        <span>{t(item.labelKey)}</span>
        {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-50" />}
      </NavLink>
    )
  }

  return (
    <aside
      className={cn(
        'sidebar flex flex-col h-full bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)]',
        mobile ? 'w-full' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--color-sidebar-border)]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-white font-bold text-base tracking-tight">NexCRM</span>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-[var(--color-sidebar-hover)] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItemEl key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-3 border-t border-[var(--color-sidebar-border)] space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <NavItemEl key={item.path} item={item} />
        ))}
      </div>
    </aside>
  )
}
