import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Snitch',
  description: 'Plataforma para generar aplicaciones móviles asistidas por IA',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full bg-[#070814] text-white antialiased">{children}</body>
    </html>
  )
}
