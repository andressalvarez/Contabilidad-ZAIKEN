import type { Metadata } from 'next'
import Head from 'next/head'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Dashboard de Resúmenes - Zaiken',
  description: 'Sistema de gestión Zaiken',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <Head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      </Head>
      <body className="bg-gray-50" suppressHydrationWarning>
        {/* Scripts cargados al final del body para evitar problemas de hidratación */}
        <script src="https://cdn.tailwindcss.com" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>

        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
