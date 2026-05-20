'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Error al iniciar sesión'); return }
      router.push('/dashboard')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    })
  }

  return (
    <div className="ppage" style={{ display:'flex',flexDirection:'column',padding:'0 24px',justifyContent:'center',minHeight:'100vh' }}>
      <div style={{ marginBottom:36 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:28,color:'var(--t2)',fontSize:13 }}>
          <span style={{ fontWeight:700,letterSpacing:2,textTransform:'uppercase' }}>snitch</span>
        </div>
        <h1 style={{ fontSize:32,fontWeight:700,marginBottom:6 }}>Bienvenido de vuelta</h1>
        <p style={{ color:'var(--t2)',fontSize:14 }}>Inicia sesión para continuar tu sesión.</p>
      </div>

      <form onSubmit={handleLogin} style={{ display:'flex',flexDirection:'column',gap:14 }}>
        <div>
          <div className="section-label">Correo electrónico</div>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',fontSize:14 }}>@</span>
            <input className="inp" style={{ paddingLeft:34 }} type="email" placeholder="usuario@correo.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
        </div>
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
            <span className="section-label" style={{ marginBottom:0 }}>Contraseña</span>
            <span style={{ fontSize:11,color:'var(--t3)',letterSpacing:0.5,cursor:'pointer' }}>¿OLVIDASTE TU CLAVE?</span>
          </div>
          <input className="inp" type="password" placeholder="••••••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        {error && (
          <div style={{ background:'rgba(240,69,69,0.08)',border:'1px solid rgba(240,69,69,0.2)',borderRadius:'var(--rs)',padding:'10px 14px',fontSize:13,color:'var(--err)' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-p" style={{ width:'100%',marginTop:4 }} disabled={loading}>
          {loading ? <span className="spin" /> : 'INICIAR SESIÓN'}
        </button>
      </form>

      <div className="divider" style={{ margin:'24px 0' }}>O CONTINÚA CON</div>

      <div style={{ display:'flex',gap:12,marginBottom:32 }}>
        <button className="btn btn-o" style={{ flex:1 }} onClick={() => handleOAuth('google')}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          GOOGLE
        </button>
        <button className="btn btn-o" style={{ flex:1 }} onClick={() => handleOAuth('github')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GITHUB
        </button>
      </div>

      <p style={{ textAlign:'center',color:'var(--t3)',fontSize:13 }}>
        ¿Nuevo en snitch?{' '}
        <Link href="/signup" style={{ color:'var(--pl)',fontWeight:600 }}>Crear cuenta</Link>
      </p>
      <p style={{ textAlign:'center',color:'var(--t3)',fontSize:11,marginTop:32,letterSpacing:0.3 }}>
        © 2026 snitch
      </p>
    </div>
  )
}
