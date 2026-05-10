import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface UIState { sidebarOpen: boolean; sidebarCollapsed: boolean; setSidebarOpen: (open: boolean) => void; toggleSidebar: () => void; setSidebarCollapsed: (collapsed: boolean) => void }
export const useUIStore = create<UIState>()(persist(
  (set) => ({ sidebarOpen: false, sidebarCollapsed: false, setSidebarOpen: (open) => set({ sidebarOpen: open }), toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })), setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }) }),
  { name: 'crm-ui' }
))
