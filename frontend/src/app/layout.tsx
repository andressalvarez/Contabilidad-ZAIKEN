import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import AppDialogProvider from '@/components/ui/AppDialogProvider'

export const metadata: Metadata = {
  title: 'Zaiken - Sistema de Gestión Financiera',
  description: 'Sistema de gestión financiera y de tiempo para negocios',
  icons: {
    icon: '/zaiken.png',
    shortcut: '/zaiken.png',
    apple: '/zaiken.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      </head>
      <body className="bg-gray-50" suppressHydrationWarning>
        {/* Scripts cargados al final del body para evitar problemas de hidratación */}
        <script src="https://cdn.tailwindcss.com" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>

        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <AppDialogProvider />
        </Providers>
      </body>
    </html>
  )
}
