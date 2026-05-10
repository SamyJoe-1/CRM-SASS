import apiClient from './client'
import type { LeaveType, LeaveRequest, LeaveBalance, PaginatedResponse, PaginationParams } from '../types'
import { buildQueryString } from '../lib/utils'

export const leaveApi = {
  getTypes: () => apiClient.get<LeaveType[]>('/leave/types').then((r) => r.data),
  createType: (data: Partial<LeaveType>) =>
    apiClient.post<LeaveType>('/leave/types', data).then((r) => r.data),
  updateType: (id: string, data: Partial<LeaveType>) =>
    apiClient.put<LeaveType>(`/leave/types/${id}`, data).then((r) => r.data),
  deleteType: (id: string) => apiClient.delete(`/leave/types/${id}`).then((r) => r.data),

  listRequests: (params: PaginationParams = {}) =>
    apiClient
      .get<PaginatedResponse<LeaveRequest>>(`/leave/requests${buildQueryString(params)}`)
      .then((r) => r.data),

  createRequest: (data: Partial<LeaveRequest>) =>
    apiClient.post<LeaveRequest>('/leave/requests', data).then((r) => r.data),

  approveRequest: (id: string, data?: { notes?: string }) =>
    apiClient.post<LeaveRequest>(`/leave/requests/${id}/approve`, data).then((r) => r.data),

  rejectRequest: (id: string, data: { reason: string }) =>
    apiClient.post<LeaveRequest>(`/leave/requests/${id}/reject`, data).then((r) => r.data),

  cancelRequest: (id: string) =>
    apiClient.post<LeaveRequest>(`/leave/requests/${id}/cancel`).then((r) => r.data),

  getBalances: (employeeId: string) =>
    apiClient.get<LeaveBalance[]>(`/leave/balances/${employeeId}`).then((r) => r.data),

  getCalendar: (params: PaginationParams = {}) =>
    apiClient.get<LeaveRequest[]>(`/leave/calendar${buildQueryString(params)}`).then((r) => r.data),
}
