'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const IconBuild = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
)
const IconGrid = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

function BottomNav() {
  const pathname = usePathname()
  const isDash     = pathname === '/dashboard'
  const isProjects = pathname === '/projects'
  const isEditor   = pathname.startsWith('/editor')
  const isSettings = pathname === '/settings'
  // Ocultar la nav en el editor en desktop (ya tiene su propio header)
  const hideOnEditor = isEditor

  if (hideOnEditor) {
    return (
      <nav className="bnav" style={{ maxWidth:430 }}>
        <Link href="/dashboard" className="bnav-item">
          <IconBuild />Construir
        </Link>
        <Link href="/projects" className="bnav-item">
          <IconGrid />Proyectos
        </Link>
        <Link href={pathname} className="bnav-item active">
          <IconChat />Editor
        </Link>
        <Link href="/settings" className="bnav-item">
          <IconSettings />Ajustes
        </Link>
      </nav>
    )
  }

  return (
    <nav className="bnav">
      <Link href="/dashboard" className={`bnav-item${isDash ? ' active' : ''}`}>
        <IconBuild />Construir
      </Link>
      <Link href="/projects" className={`bnav-item${isProjects ? ' active' : ''}`}>
        <IconGrid />Proyectos
      </Link>
      <Link href="/projects" className={`bnav-item${isEditor ? ' active' : ''}`}>
        <IconChat />Editor
      </Link>
      <Link href="/settings" className={`bnav-item${isSettings ? ' active' : ''}`}>
        <IconSettings />Ajustes
      </Link>
    </nav>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => { if (!r.ok) router.replace('/login'); else setChecking(false) })
      .catch(() => router.replace('/login'))
  }, [router])

  if (checking) {
    return (
      <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <span className="spin" style={{ width:32,height:32,borderWidth:3 }} />
      </div>
    )
  }

  return (
    <div>
      {children}
      <BottomNav />
    </div>
  )
}
