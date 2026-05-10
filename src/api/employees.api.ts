import apiClient from './client'
import type { Employee, EmployeeDocument, PaginatedResponse, PaginationParams } from '../types'
import { buildQueryString } from '../lib/utils'

export const employeesApi = {
  list: (p: PaginationParams = {}) => apiClient.get<PaginatedResponse<Employee>>(`/employees${buildQueryString(p)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Employee>(`/employees/${id}`).then((r) => r.data),
  create: (data: Partial<Employee>) => apiClient.post<Employee>('/employees', data).then((r) => r.data),
  update: (id: string, data: Partial<Employee>) => apiClient.put<Employee>(`/employees/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/employees/${id}`).then((r) => r.data),
  terminate: (id: string, data: { termination_date: string; reason: string }) => apiClient.post(`/employees/${id}/terminate`, data).then((r) => r.data),
  getDocuments: (id: string) => apiClient.get<EmployeeDocument[]>(`/employees/${id}/documents`).then((r) => r.data),
  uploadDocument: (id: string, formData: FormData) => apiClient.post<EmployeeDocument>(`/employees/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  deleteDocument: (employeeId: string, docId: string) => apiClient.delete(`/employees/${employeeId}/documents/${docId}`).then((r) => r.data),
  export: (p: PaginationParams = {}) => apiClient.get(`/employees/export${buildQueryString(p)}`, { responseType: 'blob' }).then((r) => r.data as Blob),
}
