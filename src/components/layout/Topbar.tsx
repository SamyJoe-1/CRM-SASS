import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Bell, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { cn, getInitials, formatDateTime } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { notificationsApi } from '../../api/misc.api'
import { authApi } from '../../api/auth.api'
import { Avatar, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '../ui/controls'
import { LanguageSwitcher } from '../shared/CrudModal'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Notification } from '../../types'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':'nav.dashboard','/employees':'nav.employees','/attendance':'nav.attendance',
  '/leave':'nav.leave','/payroll':'nav.payroll','/payslips':'nav.payslips',
  '/performance':'nav.performance','/kpis':'nav.kpis','/analytics':'nav.analytics',
  '/departments':'nav.departments','/positions':'nav.positions','/announcements':'nav.announcements',
  '/notifications':'nav.notifications','/audit':'nav.audit','/users':'nav.users',
  '/tenants':'nav.tenants','/settings':'nav.settings',
}

export function Topbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const { unreadCount, setUnreadCount } = useNotificationStore()
  const [notifOpen, setNotifOpen] = React.useState(false)
  const pageKey = Object.keys(PAGE_TITLES).find((k) => location.pathname.startsWith(k)) ?? '/dashboard'
  const pageTitle = t(PAGE_TITLES[pageKey] ?? 'nav.dashboard')

  const { data: unreadData } = useQuery({ queryKey: ['notifications-unread'], queryFn: notificationsApi.unreadCount, refetchInterval: 60_000, enabled: !!user })
  useEffect(() => { if (unreadData?.count !== undefined) setUnreadCount(unreadData.count) }, [unreadData, setUnreadCount])
  const { data: notifData } = useQuery({ queryKey: ['notifications-recent'], queryFn: () => notificationsApi.list({ per_page: 5 }), enabled: notifOpen && !!user })
  const markReadMutation = useMutation({ mutationFn: notificationsApi.markRead })
  const logoutMutation = useMutation({ mutationFn: authApi.logout, onSettled: () => { logout(); navigate('/login'); toast.success(t('auth.loggedOut')) } })

  return (
    <header className="h-14 bg-white border-b border-[var(--color-border)] flex items-center px-4 gap-3 flex-shrink-0">
      <button onClick={toggleSidebar} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-[var(--color-muted-bg)]"><Menu className="h-5 w-5" /></button>
      <h2 className="text-sm font-semibold text-gray-900 hidden sm:block">{pageTitle}</h2>
      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-[var(--color-muted-bg)]">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between pb-2 border-b border-[var(--color-border)] normal-case text-sm font-semibold text-gray-900">
              {t('nav.notifications')}
              <button onClick={() => { notificationsApi.markAllRead(); setUnreadCount(0) }} className="text-xs text-[var(--color-primary)] hover:underline">{t('notifications.markAllRead')}</button>
            </DropdownMenuLabel>
            <div className="max-h-72 overflow-y-auto">
              {!notifData?.data?.length ? <p className="text-sm text-gray-500 text-center py-6">{t('notifications.empty')}</p> :
                notifData.data.map((n: Notification) => (
                  <div key={n.id} onClick={() => { if (!n.read_at) markReadMutation.mutate(n.id) }}
                    className={cn('px-3 py-2.5 hover:bg-[var(--color-muted-bg)] cursor-pointer border-b border-[var(--color-border)] last:border-0', !n.read_at && 'bg-[var(--color-primary)]/5')}>
                    <div className="flex items-start gap-2">
                      {!n.read_at && <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] mt-1.5 flex-shrink-0" />}
                      <div className={cn(!n.read_at ? '' : 'pl-4')}>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{n.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="p-2 border-t border-[var(--color-border)]">
              <button onClick={() => { navigate('/notifications'); setNotifOpen(false) }} className="w-full text-xs text-center text-[var(--color-primary)] hover:underline py-1">{t('notifications.viewAll')}</button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-[var(--color-muted-bg)]">
              <Avatar src={user?.avatar} fallback={getInitials(user?.name ?? 'U')} size="sm" />
              <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">{user?.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5 border-b border-[var(--color-border)] mb-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2"><User className="h-4 w-4" />{t('common.profile')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2"><Settings className="h-4 w-4" />{t('nav.settings')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => logoutMutation.mutate()} className="gap-2"><LogOut className="h-4 w-4" />{t('auth.logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
