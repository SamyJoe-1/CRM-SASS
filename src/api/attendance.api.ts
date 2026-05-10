import apiClient from './client'
import type { AttendanceRecord, AttendancePolicy, AttendanceSummary, PaginatedResponse, PaginationParams } from '../types'
import { buildQueryString } from '../lib/utils'

export const attendanceApi = {
  getPolicy: () => apiClient.get<AttendancePolicy>('/attendance/policy').then((r) => r.data),
  updatePolicy: (data: Partial<AttendancePolicy>) =>
    apiClient.put<AttendancePolicy>('/attendance/policy', data).then((r) => r.data),

  clockIn: (data?: { location?: { lat: number; lng: number }; notes?: string }) =>
    apiClient.post('/attendance/clock-in', data).then((r) => r.data),

  clockOut: (data?: { notes?: string }) =>
    apiClient.post('/attendance/clock-out', data).then((r) => r.data),

  listRecords: (params: PaginationParams = {}) =>
    apiClient
      .get<PaginatedResponse<AttendanceRecord>>(`/attendance/records${buildQueryString(params)}`)
      .then((r) => r.data),

  updateRecord: (id: string, data: Partial<AttendanceRecord>) =>
    apiClient.put<AttendanceRecord>(`/attendance/records/${id}`, data).then((r) => r.data),

  getSummary: (employeeId: string, params: PaginationParams = {}) =>
    apiClient
      .get<AttendanceSummary>(`/attendance/summary/${employeeId}${buildQueryString(params)}`)
      .then((r) => r.data),

  export: (params: PaginationParams = {}) =>
    apiClient
      .get(`/attendance/export${buildQueryString(params)}`, { responseType: 'blob' })
      .then((r) => r.data as Blob),
}
