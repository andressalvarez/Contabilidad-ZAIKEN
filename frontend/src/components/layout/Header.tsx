'use client';

import { Menu, X } from 'lucide-react';
import Clock from '@/components/ui/Clock';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Header() {
  const { isOpen, toggle } = useSidebar();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side: Hamburger + Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger button - only visible on mobile/tablet */}
            <button
              onClick={toggle}
              className="lg:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <img
              src="/zaiken.png"
              alt="Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow"
            />

            {/* Title - responsive */}
            <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
              <span className="hidden sm:inline">Sistema de Gestión: </span>
              ZAIKEN
            </h1>
          </div>

          {/* Right side: Clock */}
          <div className="flex items-center">
            <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
              <i className="bi bi-clock hidden sm:inline"></i>
              <Clock showSeconds={true} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
