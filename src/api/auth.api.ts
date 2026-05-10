import apiClient from './client'
import type {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UpdatePasswordRequest,
  User,
} from '../types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refresh_token: string) =>
    apiClient
      .post<{ access_token: string; refresh_token: string }>('/auth/refresh', { refresh_token })
      .then((r) => r.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post('/auth/forgot-password', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post('/auth/reset-password', data).then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),

  updateMe: (data: UpdateProfileRequest) =>
    apiClient.put<User>('/auth/me', data).then((r) => r.data),

  updatePassword: (data: UpdatePasswordRequest) =>
    apiClient.put('/auth/me/password', data).then((r) => r.data),
}
