import apiClient from './client'
import type { Department, Position, Announcement, Notification, AuditLog, UserRecord, Tenant, GeneralSettings, PayrollSettings, Role, PaginatedResponse, PaginationParams } from '../types'
import { buildQueryString } from '../lib/utils'

export const departmentsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient.get<PaginatedResponse<Department>>(`/departments${buildQueryString(params)}`).then((r) => r.data),
  create: (data: Partial<Department>) => apiClient.post<Department>('/departments', data).then((r) => r.data),
  update: (id: string, data: Partial<Department>) => apiClient.put<Department>(`/departments/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/departments/${id}`).then((r) => r.data),
}

export const positionsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient.get<PaginatedResponse<Position>>(`/positions${buildQueryString(params)}`).then((r) => r.data),
  create: (data: Partial<Position>) => apiClient.post<Position>('/positions', data).then((r) => r.data),
  update: (id: string, data: Partial<Position>) => apiClient.put<Position>(`/positions/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/positions/${id}`).then((r) => r.data),
}

export const announcementsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient.get<PaginatedResponse<Announcement>>(`/announcements${buildQueryString(params)}`).then((r) => r.data),
  create: (data: Partial<Announcement>) => apiClient.post<Announcement>('/announcements', data).then((r) => r.data),
  update: (id: string, data: Partial<Announcement>) => apiClient.put<Announcement>(`/announcements/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/announcements/${id}`).then((r) => r.data),
  publish: (id: string) => apiClient.post<Announcement>(`/announcements/${id}/publish`).then((r) => r.data),
}

export const notificationsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient.get<PaginatedResponse<Notification>>(`/notifications${buildQueryString(params)}`).then((r) => r.data),
  unreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) => apiClient.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.post('/notifications/read-all').then((r) => r.data),
}

export const auditApi = {
  list: (params: PaginationParams = {}) =>
    apiClient.get<PaginatedResponse<AuditLog>>(`/audit${buildQueryString(params)}`).then((r) => r.data),
  export: (params: PaginationParams = {}) =>
    apiClient.get(`/audit/export${buildQueryString(params)}`, { responseType: 'blob' }).then((r) => r.data as Blob),
}

export const settingsApi = {
  getGeneral: () => apiClient.get<GeneralSettings>('/settings/general').then((r) => r.data),
  updateGeneral: (data: Partial<GeneralSettings>) => apiClient.put<GeneralSettings>('/settings/general', data).then((r) => r.data),
  getPayroll: () => apiClient.get<PayrollSettings>('/settings/payroll').then((r) => r.data),
  updatePayroll: (data: Partial<PayrollSettings>) => apiClient.put<PayrollSettings>('/settings/payroll', data).then((r) => r.data),
  getAttendance: () => apiClient.get('/settings/attendance').then((r) => r.data),
  updateAttendance: (data: Record<string, unknown>) => apiClient.put('/settings/attendance', data).then((r) => r.data),
  getRoles: () => apiClient.get<Role[]>('/settings/roles').then((r) => r.data),
  createRole: (data: Partial<Role>) => apiClient.post<Role>('/settings/roles', data).then((r) => r.data),
  updateRole: (id: string, data: Partial<Role>) => apiClient.put<Role>(`/settings/roles/${id}`, data).then((r) => r.data),
  deleteRole: (id: string) => apiClient.delete(`/settings/roles/${id}`).then((r) => r.data),
  getRolePermissions: (id: string) => apiClient.get(`/settings/roles/${id}/permissions`).then((r) => r.data),
  updateRolePermissions: (id: string, data: { permissions: string[] }) =>
    apiClient.put(`/settings/roles/${id}/permissions`, data).then((r) => r.data),
}

export const usersApi = {
  list: (params: PaginationParams = {}) =>
    apiClient.get<PaginatedResponse<UserRecord>>(`/users${buildQueryString(params)}`).then((r) => r.data),
  create: (data: Partial<UserRecord>) => apiClient.post<UserRecord>('/users', data).then((r) => r.data),
  update: (id: string, data: Partial<UserRecord>) => apiClient.put<UserRecord>(`/users/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/users/${id}`).then((r) => r.data),
  activate: (id: string) => apiClient.put(`/users/${id}/activate`).then((r) => r.data),
  deactivate: (id: string) => apiClient.put(`/users/${id}/deactivate`).then((r) => r.data),
  getPermissions: (id: string) => apiClient.get(`/users/${id}/permissions`).then((r) => r.data),
  updatePermissions: (id: string, data: { permissions: string[] }) =>
    apiClient.put(`/users/${id}/permissions`, data).then((r) => r.data),
}

export const tenantsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient.get<PaginatedResponse<Tenant>>(`/tenants${buildQueryString(params)}`).then((r) => r.data),
  create: (data: Partial<Tenant>) => apiClient.post<Tenant>('/tenants', data).then((r) => r.data),
  get: (id: string) => apiClient.get<Tenant>(`/tenants/${id}`).then((r) => r.data),
  update: (id: string, data: Partial<Tenant>) => apiClient.put<Tenant>(`/tenants/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/tenants/${id}`).then((r) => r.data),
  suspend: (id: string) => apiClient.post(`/tenants/${id}/suspend`).then((r) => r.data),
  restore: (id: string) => apiClient.post(`/tenants/${id}/restore`).then((r) => r.data),
}
