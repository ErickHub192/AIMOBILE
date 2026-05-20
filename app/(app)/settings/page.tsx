'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type User = { email?: string; nombre?: string }

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position:'relative',width:42,height:24,display:'inline-block',cursor:'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ opacity:0,width:0,height:0,position:'absolute' }} />
      <span style={{ position:'absolute',inset:0,background:checked?'var(--pm)':'var(--b1)',borderRadius:12,transition:'background 0.2s' }} />
      <span style={{ position:'absolute',top:3,left:checked?21:3,width:18,height:18,background:checked?'#fff':'var(--t3)',borderRadius:'50%',transition:'all 0.2s' }} />
    </label>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <button style={{ color:'var(--t2)',fontSize:18,lineHeight:1 }} onClick={onClose}>×</button>
          <span style={{ fontWeight:600,fontSize:14 }}>{title}</span>
          <span style={{ width:18 }} />
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Settings() {
  const router = useRouter()
  const [user, setUser]               = useState<User | null>(null)
  const [pushNotif, setPushNotif]     = useState(false)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [loggingOut, setLoggingOut]   = useState(false)

  // Modal Editar Perfil
  const [showProfile, setShowProfile] = useState(false)
  const [nombre, setNombre]           = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg]   = useState('')

  // Modal Seguridad
  const [showSecurity, setShowSecurity]   = useState(false)
  const [passNuevo, setPassNuevo]         = useState('')
  const [passConfirm, setPassConfirm]     = useState('')
  const [savingPass, setSavingPass]       = useState(false)
  const [passMsg, setPassMsg]             = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.data) { setUser(d.data); setNombre(d.data.nombre ?? '') }
    })
  }, [])

  async function saveProfile() {
    if (!nombre.trim()) return
    setSavingProfile(true); setProfileMsg('')
    const res = await fetch('/api/auth/me', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
    if (res.ok) {
      setUser(u => ({ ...u, nombre }))
      setProfileMsg('Perfil actualizado.')
      setTimeout(() => { setShowProfile(false); setProfileMsg('') }, 1200)
    } else {
      const d = await res.json()
      setProfileMsg(d.error || 'Error al guardar')
    }
    setSavingProfile(false)
  }

  async function savePassword() {
    if (passNuevo.length < 8) { setPassMsg('La contraseña debe tener al menos 8 caracteres'); return }
    if (passNuevo !== passConfirm) { setPassMsg('Las contraseñas no coinciden'); return }
    setSavingPass(true); setPassMsg('')
    const res = await fetch('/api/auth/me', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password_nuevo: passNuevo }),
    })
    if (res.ok) {
      setPassMsg('Contraseña actualizada.')
      setTimeout(() => { setShowSecurity(false); setPassNuevo(''); setPassConfirm(''); setPassMsg('') }, 1200)
    } else {
      const d = await res.json()
      setPassMsg(d.error || 'Error al cambiar contraseña')
    }
    setSavingPass(false)
  }

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="ppage" style={{ paddingBottom:80 }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 20px 0' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:'var(--p)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff' }}>S</div>
          <span style={{ fontWeight:700,fontSize:15 }}>snitch</span>
        </div>
      </div>

      {/* Perfil */}
      <div style={{ padding:'28px 20px 0',textAlign:'center' }}>
        <div style={{ width:80,height:80,borderRadius:20,border:'2px solid var(--pm)',margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:700,background:'var(--c2)',color:'var(--pm)' }}>
          {(user?.nombre?.[0] ?? 'U').toUpperCase()}
        </div>
        <div style={{ fontWeight:700,fontSize:18,marginBottom:4 }}>{user?.nombre || 'Usuario'}</div>
        <div style={{ color:'var(--t2)',fontSize:13 }}>{user?.email || ''}</div>
      </div>

      <div style={{ padding:'28px 20px 0' }}>
        {/* Cuenta */}
        <div className="section-label">Configuración de Cuenta</div>
        <div className="card" style={{ padding:'0 16px',marginBottom:20 }}>
          {[
            { label:'Editar Perfil', action: () => setShowProfile(true) },
            { label:'Seguridad y Privacidad', action: () => setShowSecurity(true) },
          ].map(({ label, action }, i, arr) => (
            <button key={label} onClick={action}
              style={{ display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'14px 0',background:'none',border:'none',color:'var(--t1)',cursor:'pointer',borderBottom: i < arr.length-1 ? '1px solid var(--b0)' : 'none',fontSize:14,textAlign:'left' }}>
              <span>{label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
        </div>

        {/* Notificaciones */}
        <div className="section-label">Notificaciones</div>
        <div className="card" style={{ padding:'0 16px',marginBottom:20 }}>
          {[
            { label:'Notificaciones Push', value: pushNotif, set: setPushNotif },
            { label:'Alertas por Correo',  value: emailAlerts, set: setEmailAlerts },
          ].map(({ label, value, set }, i, arr) => (
            <div key={label} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom: i < arr.length-1 ? '1px solid var(--b0)' : 'none' }}>
              <span style={{ fontSize:14 }}>{label}</span>
              <Toggle checked={value} onChange={set} />
            </div>
          ))}
        </div>

        <div style={{ display:'flex',gap:12,marginBottom:24 }}>
          <button className="btn btn-o" style={{ flex:1,fontSize:13 }}>DOCS</button>
          <button className="btn btn-o" style={{ flex:1,fontSize:13 }}>AYUDA</button>
        </div>

        <button className="btn btn-d" style={{ width:'100%' }} onClick={logout} disabled={loggingOut}>
          {loggingOut ? <span className="spin" /> : 'CERRAR SESIÓN'}
        </button>
      </div>

      {/* Modal Editar Perfil */}
      {showProfile && (
        <Modal title="Editar Perfil" onClose={() => setShowProfile(false)}>
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div>
              <div className="section-label">Nombre</div>
              <input className="inp" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Tu nombre" />
            </div>
            <div>
              <div className="section-label">Correo electrónico</div>
              <input className="inp" value={user?.email ?? ''} disabled
                style={{ opacity:0.5,cursor:'not-allowed' }} />
              <div style={{ fontSize:11,color:'var(--t3)',marginTop:4 }}>El correo no se puede cambiar desde aquí.</div>
            </div>
            {profileMsg && (
              <div style={{ fontSize:13,color: profileMsg.includes('Error') ? 'var(--err)' : 'var(--ok)',textAlign:'center' }}>{profileMsg}</div>
            )}
            <button className="btn btn-p" style={{ width:'100%' }} onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <span className="spin" /> : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Seguridad */}
      {showSecurity && (
        <Modal title="Seguridad y Privacidad" onClose={() => setShowSecurity(false)}>
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div>
              <div className="section-label">Nueva contraseña</div>
              <input className="inp" type="password" placeholder="Mínimo 8 caracteres"
                value={passNuevo} onChange={e => setPassNuevo(e.target.value)} />
            </div>
            <div>
              <div className="section-label">Confirmar contraseña</div>
              <input className="inp" type="password" placeholder="Repite la contraseña"
                value={passConfirm} onChange={e => setPassConfirm(e.target.value)} />
            </div>
            {passMsg && (
              <div style={{ fontSize:13,color: passMsg.includes('Error') || passMsg.includes('no coinciden') || passMsg.includes('menos') ? 'var(--err)' : 'var(--ok)',textAlign:'center' }}>{passMsg}</div>
            )}
            <button className="btn btn-p" style={{ width:'100%' }} onClick={savePassword} disabled={savingPass}>
              {savingPass ? <span className="spin" /> : 'Cambiar contraseña'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
