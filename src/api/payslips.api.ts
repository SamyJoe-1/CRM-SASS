import apiClient from './client'
import type { Payslip, PaginatedResponse, PaginationParams } from '../types'
import { buildQueryString } from '../lib/utils'

export const payslipsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient
      .get<PaginatedResponse<Payslip>>(`/payslips${buildQueryString(params)}`)
      .then((r) => r.data),

  mine: (params: PaginationParams = {}) =>
    apiClient
      .get<PaginatedResponse<Payslip>>(`/payslips/mine${buildQueryString(params)}`)
      .then((r) => r.data),

  get: (id: string) => apiClient.get<Payslip>(`/payslips/${id}`).then((r) => r.data),

  download: (id: string) =>
    apiClient.get(`/payslips/${id}/download`, { responseType: 'blob' }).then((r) => r.data as Blob),

  markViewed: (id: string) =>
    apiClient.post(`/payslips/${id}/viewed`).then((r) => r.data),
}
