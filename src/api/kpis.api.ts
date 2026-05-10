import apiClient from './client'
import type { KPI, KPIProgress, PaginatedResponse, PaginationParams } from '../types'
import { buildQueryString } from '../lib/utils'

export const kpisApi = {
  list: (params: PaginationParams = {}) =>
    apiClient
      .get<PaginatedResponse<KPI>>(`/kpis${buildQueryString(params)}`)
      .then((r) => r.data),

  create: (data: Partial<KPI>) => apiClient.post<KPI>('/kpis', data).then((r) => r.data),

  get: (id: string) => apiClient.get<KPI>(`/kpis/${id}`).then((r) => r.data),

  update: (id: string, data: Partial<KPI>) =>
    apiClient.put<KPI>(`/kpis/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/kpis/${id}`).then((r) => r.data),

  addProgress: (id: string, data: Partial<KPIProgress>) =>
    apiClient.post<KPIProgress>(`/kpis/${id}/progress`, data).then((r) => r.data),

  dashboard: () => apiClient.get('/kpis/dashboard').then((r) => r.data),
}
