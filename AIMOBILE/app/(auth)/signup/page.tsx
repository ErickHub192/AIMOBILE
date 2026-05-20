'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Signup() {
  const router = useRouter()
  const [nombre, setNombre]     = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('Debes aceptar los Términos de Servicio para continuar'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password, nombre }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Error al registrarse'); return }
      router.push('/dashboard')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }

  return (
    <div className="ppage" style={{ display:'flex',flexDirection:'column',padding:'0 24px',justifyContent:'center',minHeight:'100vh' }}>
      <div style={{ marginBottom:36 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:28,color:'var(--pl)',fontSize:13 }}>
          <span style={{ fontWeight:700,letterSpacing:2 }}>snitch</span>
        </div>
        <h1 style={{ fontSize:28,fontWeight:700,marginBottom:6 }}>Crear cuenta</h1>
        <p style={{ color:'var(--t2)',fontSize:14 }}>Regístrate para comenzar a construir apps con IA.</p>
      </div>

      <form onSubmit={handleSignup} style={{ display:'flex',flexDirection:'column',gap:14 }}>
        <div>
          <div className="section-label">Nombre</div>
          <input className="inp" type="text" placeholder="Tu nombre"
            value={nombre} onChange={e => setNombre(e.target.value)} required />
        </div>
        <div>
          <div className="section-label">Correo electrónico</div>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',fontSize:14 }}>@</span>
            <input className="inp" style={{ paddingLeft:34 }} type="email" placeholder="usuario@correo.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
        </div>
        <div>
          <div className="section-label">Contraseña</div>
          <input className="inp" type="password" placeholder="••••••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        </div>

        <label style={{ display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',fontSize:13,color:'var(--t2)' }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop:2,accentColor:'var(--pm)' }} />
          <span>Acepto los <span style={{ color:'var(--pl)' }}>Términos de Servicio</span> y la política de privacidad.</span>
        </label>

        {error && (
          <div style={{ background:'rgba(240,69,69,0.08)',border:'1px solid rgba(240,69,69,0.2)',borderRadius:'var(--rs)',padding:'10px 14px',fontSize:13,color:'var(--err)' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-p" style={{ width:'100%',marginTop:4 }} disabled={loading}>
          {loading ? <span className="spin" /> : 'Crear Cuenta'}
        </button>
      </form>

      <div style={{ textAlign:'center',marginTop:28,paddingTop:20,borderTop:'1px solid var(--b0)' }}>
        <div className="section-label" style={{ marginBottom:12 }}>¿Ya tienes cuenta?</div>
        <Link href="/login" className="btn btn-o btn-sm" style={{ width:'100%',display:'flex' }}>
          Iniciar Sesión
        </Link>
      </div>
      <p style={{ textAlign:'center',color:'var(--t3)',fontSize:11,marginTop:32,letterSpacing:0.3 }}>
        © 2026 snitch
      </p>
    </div>
  )
}
