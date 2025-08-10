'use client';

import Clock from '@/components/ui/Clock';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <img src="/zaiken.png" alt="Logo" className="h-10 w-10 rounded-full shadow" />
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Gestión: ZAIKEN</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <i className="bi bi-clock mr-1"></i>
              <Clock showSeconds={true} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
