'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Proyecto } from '@/lib/types/database.types'

function timeAgo(date: string) {
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (m < 1)  return 'ahora mismo'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d}d`
  return `hace ${Math.floor(d / 30)} meses`
}

const STATE_MAP: Record<string, { label: string; color: string }> = {
  en_desarrollo: { label:'En vivo',   color:'#3b82f6' },
  finalizado:    { label:'Listo',     color:'#10b981' },
  definido:      { label:'Borrador',  color:'#a78bfa' },
  en_pruebas:    { label:'Pruebas',   color:'#f59e0b' },
  cancelado:     { label:'Inactivo',  color:'#f04545' },
}

const ALL_STATES = ['todos', 'en_desarrollo', 'definido', 'en_pruebas', 'finalizado', 'cancelado']
const STATE_LABELS: Record<string, string> = {
  todos:'Todos', en_desarrollo:'En vivo', definido:'Borrador',
  en_pruebas:'Pruebas', finalizado:'Listo', cancelado:'Inactivo'
}

export default function Projects() {
  const router = useRouter()
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('todos')
  const [showModal, setShowModal]   = useState(false)
  const [newName, setNewName]       = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [creating, setCreating]     = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    fetch('/api/projects').then(r => r.json())
      .then(d => { setProjects(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return projects
      .filter(p => filter === 'todos' || p.estado === filter)
      .filter(p => !search || p.nombre_proyecto.toLowerCase().includes(search.toLowerCase()) || (p.descripcion_inicial ?? '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [projects, filter, search])

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
    const s = STATE_MAP[estado] || { label: estado, color:'var(--t3)' }
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
        <h1 style={{ fontSize:22,fontWeight:700 }}>Mis Proyectos</h1>
        <button className="btn btn-p btn-sm" onClick={() => { setShowModal(true); setCreateError('') }}>
          + Nuevo
        </button>
      </div>

      {/* Buscador */}
      <div style={{ padding:'16px 20px 0' }}>
        <div style={{ position:'relative' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className="inp" style={{ paddingLeft:36 }} placeholder="Buscar proyectos..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding:'12px 20px 0', display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
        {ALL_STATES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ whiteSpace:'nowrap',padding:'5px 12px',borderRadius:99,fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.18s',
              background: filter===s ? 'var(--p)' : 'transparent',
              color: filter===s ? '#fff' : 'var(--t3)',
              border: `1px solid ${filter===s ? 'var(--p)' : 'var(--b1)'}` }}>
            {STATE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Contador */}
      <div style={{ padding:'12px 20px 0',color:'var(--t3)',fontSize:12 }}>
        {loading ? 'Cargando...' : `${filtered.length} proyecto${filtered.length !== 1 ? 's' : ''}`}
      </div>

      {/* Lista */}
      <div style={{ padding:'12px 20px 0' }}>
        {loading ? (
          <div style={{ textAlign:'center',padding:'32px 0' }}>
            <span className="spin" style={{ display:'block',margin:'0 auto',width:28,height:28 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding:'36px 24px',textAlign:'center' }}>
            
            <div style={{ color:'var(--t2)',fontSize:14,marginBottom:16 }}>
              {search || filter !== 'todos' ? 'No se encontraron proyectos con ese filtro.' : '¡Aún no tienes proyectos. Crea el primero!'}
            </div>
            {!search && filter === 'todos' && (
              <button className="btn btn-p" onClick={() => { setShowModal(true); setCreateError('') }}>
                + Crear Proyecto
              </button>
            )}
          </div>
        ) : (
          <div className="project-grid">
            {filtered.map(p => (
              <button key={p.id} className="card card-i" style={{ width:'100%',padding:'16px',textAlign:'left',cursor:'pointer',display:'block' }}
                onClick={() => router.push(`/editor/${p.id}`)}>
                <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:8 }}>
                  <div style={{ fontWeight:600,fontSize:15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1 }}>{p.nombre_proyecto}</div>
                  <Badge estado={p.estado} />
                </div>
                {p.descripcion_inicial && (
                  <div style={{ color:'var(--t2)',fontSize:12,marginBottom:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {p.descripcion_inicial}
                  </div>
                )}
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:5,color:'var(--t3)',fontSize:11 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {timeAgo(p.created_at)}
                  </div>
                  <span style={{ fontSize:11,color:'var(--pm)' }}>Abrir Editor →</span>
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

      {/* Modal */}
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
                  onKeyDown={e => e.key==='Enter' && createProject()} />
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
