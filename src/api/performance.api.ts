import apiClient from './client'
import type { PerformanceReview, PaginatedResponse, PaginationParams } from '../types'
import { buildQueryString } from '../lib/utils'

export const performanceApi = {
  list: (params: PaginationParams = {}) =>
    apiClient
      .get<PaginatedResponse<PerformanceReview>>(`/performance${buildQueryString(params)}`)
      .then((r) => r.data),

  create: (data: Partial<PerformanceReview>) =>
    apiClient.post<PerformanceReview>('/performance', data).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<PerformanceReview>(`/performance/${id}`).then((r) => r.data),

  update: (id: string, data: Partial<PerformanceReview>) =>
    apiClient.put<PerformanceReview>(`/performance/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/performance/${id}`).then((r) => r.data),

  submit: (id: string) =>
    apiClient.post<PerformanceReview>(`/performance/${id}/submit`).then((r) => r.data),

  acknowledge: (id: string) =>
    apiClient.post<PerformanceReview>(`/performance/${id}/acknowledge`).then((r) => r.data),

  stats: () => apiClient.get('/performance/stats').then((r) => r.data),
}
