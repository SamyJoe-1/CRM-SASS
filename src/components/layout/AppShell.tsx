import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useUIStore } from '../../stores/uiStore'
import { TooltipProvider } from '../ui/controls'

export function AppShell() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--color-surface)]">
        <div className="hidden md:flex flex-shrink-0"><Sidebar /></div>
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-50 w-64"><Sidebar mobile /></div>
          </div>
        )}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 page-enter"><Outlet /></main>
        </div>
      </div>
    </TooltipProvider>
  )
}
