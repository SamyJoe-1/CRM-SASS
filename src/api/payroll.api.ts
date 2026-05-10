import apiClient from './client'
import type { PayrollCycle, PayrollRecord, PaginatedResponse, PaginationParams } from '../types'
import { buildQueryString } from '../lib/utils'

export const payrollApi = {
  list: (params: PaginationParams = {}) =>
    apiClient
      .get<PaginatedResponse<PayrollCycle>>(`/payroll${buildQueryString(params)}`)
      .then((r) => r.data),

  create: (data: Partial<PayrollCycle>) =>
    apiClient.post<PayrollCycle>('/payroll', data).then((r) => r.data),

  get: (id: string) => apiClient.get<PayrollCycle>(`/payroll/${id}`).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/payroll/${id}`).then((r) => r.data),

  generate: (id: string) => apiClient.post(`/payroll/${id}/generate`).then((r) => r.data),

  getRecords: (id: string, params: PaginationParams = {}) =>
    apiClient
      .get<PaginatedResponse<PayrollRecord>>(`/payroll/${id}/records${buildQueryString(params)}`)
      .then((r) => r.data),

  updateRecord: (id: string, recordId: string, data: Partial<PayrollRecord>) =>
    apiClient
      .put<PayrollRecord>(`/payroll/${id}/records/${recordId}`, data)
      .then((r) => r.data),

  processRecord: (id: string, recordId: string) =>
    apiClient.post(`/payroll/${id}/records/${recordId}/process`).then((r) => r.data),

  processAll: (id: string) => apiClient.post(`/payroll/${id}/process-all`).then((r) => r.data),

  cancelRecord: (id: string, recordId: string) =>
    apiClient.post(`/payroll/${id}/records/${recordId}/cancel`).then((r) => r.data),

  cancelAll: (id: string) => apiClient.post(`/payroll/${id}/cancel-all`).then((r) => r.data),

  getSummary: (id: string) =>
    apiClient.get(`/payroll/${id}/summary`).then((r) => r.data),

  export: (id: string) =>
    apiClient
      .get(`/payroll/${id}/export`, { responseType: 'blob' })
      .then((r) => r.data as Blob),
}
