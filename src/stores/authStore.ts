import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null; accessToken: string | null; refreshToken: string | null; isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void; logout: () => void
  hasPermission: (permission: string) => boolean; isRole: (role: string | string[]) => boolean
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
    setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
    setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
    setUser: (user) => set({ user }),
    logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    hasPermission: (permission) => { const { user } = get(); if (!user) return false; if (user.role === 'super_admin') return true; return user.permissions?.includes(permission) ?? false },
    isRole: (role) => { const { user } = get(); if (!user) return false; if (user.role === 'super_admin') return true; if (Array.isArray(role)) return role.includes(user.role); return user.role === role },
  }),
  { name: 'crm-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }) }
))
