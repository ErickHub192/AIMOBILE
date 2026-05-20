'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Proyecto } from '@/lib/types/database.types'

function timeAgo(date: string) {
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (m < 1)  return 'ahora mismo'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

const STATE_MAP: Record<string, { label: string; color: string }> = {
  en_desarrollo: { label:'EN VIVO', color:'#3b82f6' },
  finalizado:    { label:'LISTO',   color:'#10b981' },
  definido:      { label:'BORRADOR',color:'#a78bfa' },
  en_pruebas:    { label:'PRUEBAS', color:'#f59e0b' },
  cancelado:     { label:'INACTIVO',color:'#f04545' },
}

export default function Dashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName]   = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    fetch('/api/projects').then(r => r.json())
      .then(d => { setProjects(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function createProject() {
    if (!newName.trim()) return
    setCreating(true); setCreateError('')
    try {
      const res = await fetch('/api/projects', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nombre_proyecto: newName.trim(), descripcion_inicial: newDesc.trim() || undefined }),
      })
      const d = await res.json()
      if (!res.ok) { setCreateError(d.error || 'Error al crear el proyecto'); return }
      setShowModal(false); setNewName(''); setNewDesc('')
      router.push(`/editor/${d.data.id}`)
    } catch { setCreateError('Error de conexión') }
    finally { setCreating(false) }
  }

  const Badge = ({ estado }: { estado: string }) => {
    const s = STATE_MAP[estado] || { label: estado.toUpperCase(), color:'var(--t3)' }
    return (
      <span style={{ fontSize:9,fontWeight:700,letterSpacing:0.8,padding:'3px 8px',borderRadius:4,background:`${s.color}22`,color:s.color,border:`1px solid ${s.color}44`,whiteSpace:'nowrap' }}>
        {s.label}
      </span>
    )
  }

  return (
    <div className="ppage" style={{ paddingBottom:80 }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 20px 0' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:'var(--p)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#fff' }}>✦</div>
          <span style={{ fontWeight:700,fontSize:15 }}>SnitchAI</span>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <button style={{ color:'var(--t2)',display:'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg, var(--p), var(--cy))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff' }}>A</div>
        </div>
      </div>

      <div style={{ padding:'28px 20px 0' }}>
        <h1 style={{ fontSize:26,fontWeight:700,marginBottom:4 }}>
          Bienvenido, <span style={{ color:'var(--pm)' }}>Arquitecto</span>
        </h1>
        <p style={{ color:'var(--t2)',fontSize:13 }}>¿Qué construirás hoy? Tu espacio de trabajo IA está listo.</p>
      </div>

      {/* Nuevo Proyecto */}
      <div style={{ padding:'24px 20px 0' }}>
        <button className="card card-i" style={{ width:'100%',padding:'18px',display:'flex',alignItems:'center',gap:14,textAlign:'left',cursor:'pointer' }}
          onClick={() => { setShowModal(true); setCreateError('') }}>
          <div style={{ width:44,height:44,borderRadius:12,background:'var(--pg)',border:'1px solid var(--bp)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:'var(--pm)',flexShrink:0 }}>+</div>
          <div>
            <div style={{ fontWeight:600,fontSize:15,marginBottom:3 }}>Nuevo Proyecto</div>
            <div style={{ color:'var(--t2)',fontSize:12 }}>Inicializa un nuevo lienzo con guía de IA.</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft:'auto',flexShrink:0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* Estado del Sistema */}
      <div style={{ padding:'16px 20px 0' }}>
        <div className="card" style={{ padding:'16px' }}>
          <div className="section-label">Estado del Sistema</div>
          <div style={{ fontWeight:600,fontSize:15,marginBottom:12 }}>Motor Neural Activo</div>
          <div style={{ display:'flex',gap:10 }}>
            <div style={{ background:'var(--c3)',borderRadius:'var(--rs)',padding:'8px 14px' }}>
              <div style={{ fontSize:10,color:'var(--t3)',marginBottom:3 }}>PROYECTOS</div>
              <div style={{ fontWeight:700,fontSize:16 }}>{loading ? '—' : projects.length}</div>
            </div>
            <div style={{ background:'var(--c3)',borderRadius:'var(--rs)',padding:'8px 14px' }}>
              <div style={{ fontSize:10,color:'var(--t3)',marginBottom:3 }}>DISPONIBILIDAD</div>
              <div style={{ fontWeight:700,fontSize:16,color:'var(--ok)' }}>99.9%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Proyectos Recientes */}
      <div style={{ padding:'24px 20px 0' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
          <h2 style={{ fontSize:17,fontWeight:600 }}>Proyectos Recientes</h2>
          <span style={{ fontSize:12,color:'var(--pm)',cursor:'pointer' }}>Ver todos ↗</span>
        </div>

        {loading ? (
          <div style={{ textAlign:'center',padding:'32px 0' }}>
            <span className="spin" style={{ margin:'0 auto',display:'block',width:28,height:28 }} />
          </div>
        ) : projects.length === 0 ? (
          <div className="card" style={{ padding:'32px',textAlign:'center' }}>
            
            <div style={{ color:'var(--t2)',fontSize:14 }}>Aún no tienes proyectos. ¡Crea el primero!</div>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {projects.slice(0,6).map(p => (
              <button key={p.id} className="card card-i" style={{ width:'100%',padding:'16px',textAlign:'left',cursor:'pointer',display:'block' }}
                onClick={() => router.push(`/editor/${p.id}`)}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
                  <div style={{ fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'75%' }}>{p.nombre_proyecto}</div>
                  <Badge estado={p.estado} />
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:5,color:'var(--t3)',fontSize:11 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {timeAgo(p.created_at)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { setShowModal(true); setCreateError('') }}
        style={{ position:'fixed',bottom:'calc(72px + env(safe-area-inset-bottom, 0px))',right:20,width:52,height:52,borderRadius:'50%',background:'var(--p)',color:'#fff',fontSize:24,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 24px var(--pg)',zIndex:50 }}>
        +
      </button>

      {/* Modal Nuevo Proyecto */}
      {showModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="sheet">
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
              <h2 style={{ fontSize:18,fontWeight:700 }}>Nuevo Proyecto</h2>
              <button style={{ color:'var(--t2)',fontSize:22,lineHeight:1 }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div>
                <div className="section-label">Nombre del Proyecto</div>
                <input className="inp" placeholder="Mi App Increíble" value={newName}
                  onChange={e => setNewName(e.target.value)} autoFocus
                  onKeyDown={e => e.key === 'Enter' && createProject()} />
              </div>
              <div>
                <div className="section-label">Descripción (opcional)</div>
                <textarea className="inp" placeholder="Describe la idea de tu app..." value={newDesc}
                  onChange={e => setNewDesc(e.target.value)} style={{ resize:'vertical',minHeight:72 }} />
              </div>
              {createError && (
                <div style={{ background:'rgba(240,69,69,0.08)',border:'1px solid rgba(240,69,69,0.2)',borderRadius:'var(--rs)',padding:'10px 14px',fontSize:13,color:'var(--err)' }}>
                  {createError}
                </div>
              )}
              <button className="btn btn-p" style={{ width:'100%' }} onClick={createProject}
                disabled={creating || !newName.trim()}>
                {creating ? <span className="spin" /> : 'Inicializar Proyecto →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
