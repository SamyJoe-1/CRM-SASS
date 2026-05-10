import apiClient from './client'
import type { AnalyticsOverview, PaginationParams } from '../types'
import { buildQueryString } from '../lib/utils'

export const analyticsApi = {
  overview: () => apiClient.get<AnalyticsOverview>('/analytics/overview').then((r) => r.data),

  attendanceTrends: (params: PaginationParams = {}) =>
    apiClient
      .get(`/analytics/attendance-trends${buildQueryString(params)}`)
      .then((r) => r.data),

  payrollTrends: (params: PaginationParams = {}) =>
    apiClient.get(`/analytics/payroll-trends${buildQueryString(params)}`).then((r) => r.data),

  leaveUsage: (params: PaginationParams = {}) =>
    apiClient.get(`/analytics/leave-usage${buildQueryString(params)}`).then((r) => r.data),

  performance: (params: PaginationParams = {}) =>
    apiClient.get(`/analytics/performance${buildQueryString(params)}`).then((r) => r.data),

  kpiAchievement: (params: PaginationParams = {}) =>
    apiClient.get(`/analytics/kpi-achievement${buildQueryString(params)}`).then((r) => r.data),

  headcount: (params: PaginationParams = {}) =>
    apiClient.get(`/analytics/headcount${buildQueryString(params)}`).then((r) => r.data),

  export: (data: { type: string; format: string; params?: PaginationParams }) =>
    apiClient
      .post('/analytics/export', data, { responseType: 'blob' })
      .then((r) => r.data as Blob),
}
