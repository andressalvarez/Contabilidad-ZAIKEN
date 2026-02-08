'use client'

import Header from './Header'
import Sidebar from './Sidebar'
import { SidebarProvider } from '@/contexts/SidebarContext'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          {/* Main content - margin left on desktop for fixed sidebar */}
          <main className="flex-1 lg:ml-64 min-h-[calc(100vh-64px)]">
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
