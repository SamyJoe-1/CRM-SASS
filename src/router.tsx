import React, { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useAuthStore } from './stores/authStore'
import { PageLoader } from './components/shared/StatusBadge'

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage'))
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'))
const LeavePage = lazy(() => import('./pages/leave/LeavePage'))
const PayrollPage = lazy(() => import('./pages/payroll/PayrollPage'))
const PayslipsPage = lazy(() => import('./pages/payslips/PayslipsPage'))
const PerformancePage = lazy(() => import('./pages/performance/PerformancePage'))
const KpisPage = lazy(() => import('./pages/kpis/KpisPage'))
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'))
const DepartmentsPage = lazy(() => import('./pages/departments/DepartmentsPage'))
const PositionsPage = lazy(() => import('./pages/positions/PositionsPage'))
const AnnouncementsPage = lazy(() => import('./pages/announcements/AnnouncementsPage'))
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'))
const AuditPage = lazy(() => import('./pages/audit/AuditPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const UsersPage = lazy(() => import('./pages/users/UsersPage'))
const TenantsPage = lazy(() => import('./pages/tenants/TenantsPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/login', element: <SuspenseWrap><LoginPage /></SuspenseWrap> },
  { path: '/forgot-password', element: <SuspenseWrap><ForgotPasswordPage /></SuspenseWrap> },
  { path: '/reset-password', element: <SuspenseWrap><ResetPasswordPage /></SuspenseWrap> },
  {
    path: '/',
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <SuspenseWrap><DashboardPage /></SuspenseWrap> },
      { path: 'employees', element: <SuspenseWrap><EmployeesPage /></SuspenseWrap> },
      { path: 'attendance', element: <SuspenseWrap><AttendancePage /></SuspenseWrap> },
      { path: 'leave', element: <SuspenseWrap><LeavePage /></SuspenseWrap> },
      { path: 'payroll', element: <SuspenseWrap><PayrollPage /></SuspenseWrap> },
      { path: 'payslips', element: <SuspenseWrap><PayslipsPage /></SuspenseWrap> },
      { path: 'performance', element: <SuspenseWrap><PerformancePage /></SuspenseWrap> },
      { path: 'kpis', element: <SuspenseWrap><KpisPage /></SuspenseWrap> },
      { path: 'analytics', element: <SuspenseWrap><AnalyticsPage /></SuspenseWrap> },
      { path: 'departments', element: <SuspenseWrap><DepartmentsPage /></SuspenseWrap> },
      { path: 'positions', element: <SuspenseWrap><PositionsPage /></SuspenseWrap> },
      { path: 'announcements', element: <SuspenseWrap><AnnouncementsPage /></SuspenseWrap> },
      { path: 'notifications', element: <SuspenseWrap><NotificationsPage /></SuspenseWrap> },
      { path: 'audit', element: <SuspenseWrap><AuditPage /></SuspenseWrap> },
      { path: 'settings', element: <SuspenseWrap><SettingsPage /></SuspenseWrap> },
      { path: 'users', element: <SuspenseWrap><UsersPage /></SuspenseWrap> },
      { path: 'tenants', element: <SuspenseWrap><TenantsPage /></SuspenseWrap> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
