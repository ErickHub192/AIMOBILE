'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Mensaje, Proyecto, VersionAplicacion, Pantalla, Preview } from '@/lib/types/database.types'

interface ChatMsg extends Mensaje { loading?: boolean }
interface VersionDetalle extends VersionAplicacion {
  pantallas: Pantalla[]
  preview: Preview | null
}

/* ──────────────── Preview Panel ──────────────── */
function PhoneFrame({ version, loading, projectName: pjName }: { version: VersionDetalle | null; loading: boolean; projectName: string }) {
  const [tab, setTab] = useState<'pantallas'|'codigo'|'preview'>('codigo')

  const noContent = !version
  const hasCode   = !!version?.ruta_codigo_fuente
  const hasUrl    = !!version?.preview?.url_preview
  const screens   = version?.pantallas ?? []

  // Reset tab when version changes
  useEffect(() => { setTab(version?.ruta_codigo_fuente ? 'codigo' : 'pantallas') }, [version?.id])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 16px', height:'100%', overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, color:'var(--t3)', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>
        <span className="dot-ok pulse" style={{ opacity: loading ? 0 : 1 }} />
        {loading ? 'Generando preview...' : version ? `v${version.numero_version} · ${screens.length} pantalla${screens.length !== 1 ? 's' : ''}` : 'Sin código generado aún'}
      </div>

      {version && (
        <div className="preview-tabs" style={{ width:260, marginBottom:16 }}>
          <button className={`preview-tab${tab==='pantallas'?' active':''}`} onClick={() => setTab('pantallas')}>Pantallas</button>
          {hasCode && <button className={`preview-tab${tab==='codigo'?' active':''}`} onClick={() => setTab('codigo')}>Código</button>}
          {hasUrl  && <button className={`preview-tab${tab==='preview'?' active':''}`} onClick={() => setTab('preview')}>Preview</button>}
        </div>
      )}

      <div className="phone-frame">
        <div className="phone-notch">
          <div style={{ width:6,height:6,borderRadius:'50%',background:'rgba(255,255,255,0.2)' }} />
          <div style={{ width:32,height:5,borderRadius:3,background:'rgba(255,255,255,0.1)' }} />
        </div>
        <div className="phone-content">
          {loading ? (
            <PhoneLoading />
          ) : noContent ? (
            <PhoneEmpty />
          ) : tab === 'preview' && hasUrl ? (
            <iframe src={version!.preview!.url_preview!} style={{ width:'100%',height:'100%',border:'none' }} title="Vista previa" />
          ) : tab === 'codigo' && hasCode ? (
            <CodeViewer code={version!.ruta_codigo_fuente!} />
          ) : (
            <PhoneScreenList screens={screens} projectName={pjName} />
          )}
        </div>
        <div className="phone-home" />
      </div>

      {version && (
        <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:6, width:260 }}>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'var(--c2)', borderRadius:'var(--rs)', fontSize:11 }}>
            <span style={{ color:'var(--t3)' }}>Framework</span>
            <span style={{ color:'var(--pl)', fontWeight:600 }}>{version.framework_objetivo ?? 'React Native'}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'var(--c2)', borderRadius:'var(--rs)', fontSize:11 }}>
            <span style={{ color:'var(--t3)' }}>Estado</span>
            <StateChip estado={version.estado_generacion} />
          </div>
        </div>
      )}
    </div>
  )
}

const STATE_CHIP: Record<string, { label: string; color: string }> = {
  generada:    { label:'Generada',    color:'#3b82f6' },
  validada:    { label:'Validada',    color:'#10b981' },
  rechazada:   { label:'Rechazada',   color:'#f04545' },
  en_revision: { label:'En revisión', color:'#f59e0b' },
}
function StateChip({ estado }: { estado: string }) {
  const s = STATE_CHIP[estado] ?? { label: estado, color:'var(--t3)' }
  return <span style={{ color:s.color, fontWeight:600 }}>{s.label}</span>
}

function PhoneLoading() {
  return (
    <div style={{ padding:'30px 16px', display:'flex', flexDirection:'column', gap:12 }}>
      {[80,60,90,50,70].map((w,i) => (
        <div key={i} className="pulse" style={{ height:12,width:`${w}%`,background:'var(--c3)',borderRadius:6,animationDelay:`${i*0.1}s` }} />
      ))}
      <div style={{ height:80, background:'var(--c3)', borderRadius:10, marginTop:8 }} className="pulse" />
      {[65,45,80].map((w,i) => (
        <div key={i} className="pulse" style={{ height:10,width:`${w}%`,background:'var(--c3)',borderRadius:6,animationDelay:`${i*0.15}s` }} />
      ))}
    </div>
  )
}

/* ── Visor de código con resaltado básico ── */
function CodeViewer({ code }: { code: string }) {
  const lines = code.split('\n')

  return (
    <div style={{ height:'100%', overflow:'auto', background:'#0d1117', padding:'10px 8px' }}>
      <div style={{ fontFamily:'monospace', fontSize:9, lineHeight:1.7 }}>
        {lines.map((line, i) => {
          const trimmed = line.trimStart()
          const isComment = trimmed.startsWith('//')
          const isImport  = /^(import|export)\b/.test(trimmed)
          const isKeyword = /^(const|let|var|function|return|if|else|async|class)\b/.test(trimmed)
          const isJSX     = trimmed.startsWith('<') || trimmed.startsWith('return (')
          const isStyle   = trimmed.startsWith('styles') || trimmed.startsWith('StyleSheet')

          let color = '#c9d1d9'
          if (isComment) color = '#6e7681'
          else if (isImport) color = '#d2a8ff'
          else if (isKeyword) color = '#ff7b72'
          else if (isJSX) color = '#7ee787'
          else if (isStyle) color = '#ffa657'

          return (
            <div key={i} style={{ display:'flex', gap:6, minWidth:0 }}>
              <span style={{ color:'#6e7681', minWidth:22, textAlign:'right', flexShrink:0, userSelect:'none' }}>
                {i + 1}
              </span>
              <span style={{ color, whiteSpace:'pre-wrap', wordBreak:'break-all', flex:1, minWidth:0 }}>
                {line || '\u00a0'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PhoneEmpty() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
      <div style={{ width:48,height:48,borderRadius:12,background:'var(--c3)',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
      </div>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--t2)', marginBottom:6 }}>Vista previa disponible</div>
      <div style={{ fontSize:11, color:'var(--t3)', lineHeight:1.5 }}>Describe tu app en el chat para que la IA genere el código y las pantallas.</div>
    </div>
  )
}

function PhoneScreenList({ screens, projectName }: { screens: Pantalla[]; projectName: string }) {
  const [active, setActive] = useState(0)
  if (screens.length === 0) return <PhoneEmpty />

  const screen = screens[active]
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'12px 14px 10px', background:'rgba(124,58,237,0.12)', borderBottom:'1px solid rgba(124,58,237,0.15)', marginTop:4 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--pl)', textTransform:'uppercase', letterSpacing:0.5 }}>{projectName}</div>
      </div>

      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--b0)', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:8,height:8,borderRadius:'50%',background:'var(--ok)' }} />
        <span style={{ fontSize:11, fontWeight:700, color:'var(--t2)', textTransform:'uppercase', letterSpacing:0.5 }}>{screen.nombre_pantalla}</span>
      </div>

      <div style={{ flex:1, padding:'14px', overflow:'auto' }}>
        {screen.descripcion_funcional ? (
          <div style={{ fontSize:12, color:'var(--t2)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
            {screen.descripcion_funcional}
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:16,textAlign:'center',gap:10 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            <div style={{ fontSize:11,color:'var(--t3)',lineHeight:1.5 }}>
              Pantalla generada.<br/>Usa la tab <strong style={{color:'var(--pl)'}}>Código</strong> para ver el código completo.
            </div>
          </div>
        )}
      </div>

      {screens.length > 1 && (
        <div style={{ display:'flex', borderTop:'1px solid var(--b0)', flexShrink:0 }}>
          {screens.slice(0,5).map((s,i) => (
            <button key={s.id} onClick={() => setActive(i)}
              style={{ flex:1,padding:'7px 0',fontSize:8,fontWeight:700,letterSpacing:0.5,textTransform:'uppercase',cursor:'pointer',background:'none',border:'none',color:active===i?'var(--pm)':'var(--t3)',borderTop:`2px solid ${active===i?'var(--pm)':'transparent'}`,transition:'all 0.18s' }}>
              {s.nombre_pantalla.length > 6 ? s.nombre_pantalla.slice(0,5)+'…' : s.nombre_pantalla}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ──────────────── Main Editor ──────────────── */
export default function Editor() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [project, setProject]               = useState<Proyecto | null>(null)
  const [messages, setMessages]             = useState<ChatMsg[]>([])
  const [versionDetalle, setVersionDetalle] = useState<VersionDetalle | null>(null)
  const [versionLoading, setVersionLoading] = useState(false)
  const [input, setInput]                   = useState('')
  const [sending, setSending]               = useState(false)
  const [showExport, setShowExport]         = useState(false)
  const [showActions, setShowActions]       = useState(false)
  const [actionLoading, setActionLoading]   = useState('')
  const [exportType, setExportType]         = useState<'assets'|'publish'>('assets')
  const [exporting, setExporting]           = useState(false)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadVersionDetail = useCallback(async () => {
    setVersionLoading(true)
    try {
      const res  = await fetch(`/api/versions/${id}/detail`)
      const data = await res.json()
      setVersionDetalle(data.data ?? null)
    } finally {
      setVersionLoading(false)
    }
  }, [id])

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/chat/${id}`).then(r => r.json()),
    ]).then(([proj, chat]) => {
      if (proj.data) setProject(proj.data)
      if (chat.data) setMessages(chat.data)
    })
    loadVersionDetail()
  }, [id, loadVersionDetail])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setSending(true)

    const userMsg: ChatMsg = { id:'u-tmp',conversacion_id:id,emisor:'usuario',contenido:text,tipo_mensaje:'consulta',fecha_envio:new Date().toISOString(),orden_mensaje:messages.length+1,created_at:new Date().toISOString() }
    const thinkMsg: ChatMsg = { ...userMsg,id:'ia-tmp',emisor:'ia',contenido:'',loading:true,orden_mensaje:messages.length+2 }
    setMessages(prev => [...prev, userMsg, thinkMsg])

    try {
      const res = await fetch(`/api/chat/${id}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contenido:text }),
      })
      const d = await res.json()
      setMessages(prev => [...prev.filter(m => !m.loading), ...(d.data ? [d.data] : [])])
      // Refresca el visualizador — el backend ya guardó la versión antes de responder
      loadVersionDetail()
    } catch {
      setMessages(prev => prev.filter(m => !m.loading))
    } finally {
      setSending(false)
    }
  }

  async function handleProjectAction(accion: 'validar' | 'rechazar' | 'eliminar') {
    setActionLoading(accion)
    try {
      if (accion === 'eliminar') {
        if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return
        await fetch(`/api/projects/${id}`, { method: 'DELETE' })
        router.push('/dashboard')
        return
      }
      await fetch(`/api/versions/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion }),
      })
      setShowActions(false)
      loadVersionDetail()
    } finally {
      setActionLoading('')
    }
  }

  async function handleExport() {
    if (!versionDetalle?.id) return
    setExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: versionDetalle.id, tipo: exportType }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al exportar' }))
        alert(err.error || 'Error al exportar')
        return
      }

      // Descargar el ZIP directamente en el navegador
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `snitch-app-${versionDetalle.numero_version}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setShowExport(false)
    } finally {
      setExporting(false)
    }
  }

  const Bubble = ({ msg }: { msg: ChatMsg }) => {
    const isUser = msg.emisor === 'usuario'
    return (
      <div className="fade-up" style={{ display:'flex',flexDirection:'column',gap:4,alignItems:isUser?'flex-end':'flex-start' }}>
        {!isUser && <span style={{ fontSize:10,color:'var(--t3)',marginLeft:2 }}>snitch IA</span>}
        <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
          {msg.loading ? (
            <span style={{ display:'inline-flex',gap:4,alignItems:'center' }}>
              {[0,1,2].map(i => (
                <span key={i} className="pulse" style={{ width:6,height:6,background:'var(--t3)',borderRadius:'50%',display:'inline-block',animationDelay:`${i*0.2}s` }} />
              ))}
            </span>
          ) : (
            <span style={{ whiteSpace:'pre-wrap' }}>{msg.contenido}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="editor-root">
      {/* Panel Chat */}
      <div className="editor-chat-panel">
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderBottom:'1px solid var(--b0)',background:'var(--c1)',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <button onClick={() => router.push('/dashboard')} style={{ color:'var(--t2)',display:'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{ width:26,height:26,borderRadius:7,background:'var(--p)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff' }}>S</div>
            <div>
              <div style={{ fontWeight:600,fontSize:12 }}>snitch</div>
              {project && <div style={{ fontSize:9,color:'var(--t3)',textTransform:'uppercase',letterSpacing:0.5 }}>Diseñando: {project.nombre_proyecto}</div>}
            </div>
          </div>
          <div style={{ display:'flex',gap:6 }}>
            <button className="btn btn-p btn-sm" style={{ gap:4,fontSize:10 }} onClick={() => setShowExport(true)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar
            </button>
            <button className="btn btn-o btn-sm" style={{ padding:'0 8px' }} onClick={() => setShowActions(true)} title="Acciones del proyecto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div style={{ flex:1,overflowY:'auto',padding:'14px',display:'flex',flexDirection:'column',gap:12 }}>
          {messages.length === 0 && !sending && (
            <div style={{ textAlign:'center',padding:'40px 0',color:'var(--t3)' }}>
              <div style={{ width:48,height:48,borderRadius:14,background:'var(--c2)',margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div style={{ fontSize:14,fontWeight:600,color:'var(--t2)',marginBottom:5 }}>IA lista</div>
              <div style={{ fontSize:12,lineHeight:1.5 }}>Describe la app móvil que quieres construir y la IA generará el código y la vista previa.</div>
            </div>
          )}
          {messages.map((msg, i) => <Bubble key={`${msg.id}-${i}`} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        {/* Barra de modo */}
        <div style={{ padding:'4px 14px',background:'var(--c1)',borderTop:'1px solid var(--b0)',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
            <span className="dot-ok pulse" style={{ width:5,height:5,flexShrink:0 }} />
            <span style={{ fontSize:8,color:'var(--t3)',letterSpacing:0.8,fontWeight:700 }}>IA EN MODO GENERACIÓN</span>
          </div>
        </div>

        {/* Input */}
        <div style={{ padding:'10px 12px',background:'var(--c1)',borderTop:'1px solid var(--b0)',flexShrink:0,paddingBottom:'calc(10px + 60px + env(safe-area-inset-bottom, 0px))' }}>
          <div style={{ display:'flex',alignItems:'flex-end',gap:8,background:'var(--c2)',border:'1px solid var(--b1)',borderRadius:'var(--r)',padding:'9px 10px' }}>
            <textarea
              ref={textareaRef}
              style={{ flex:1,background:'none',border:'none',color:'var(--t1)',fontSize:13,resize:'none',lineHeight:1.5,maxHeight:120,minHeight:20,fontFamily:'inherit',overflowY:'auto' }}
              placeholder="Escribe un comando o describe lo que quieres construir"
              value={input}
              onChange={handleInputChange}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              rows={1}
            />
            <button onClick={send} disabled={!input.trim() || sending}
              style={{ width:34,height:34,borderRadius:'var(--rs)',background:input.trim()&&!sending?'var(--p)':'var(--c3)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.18s',flexShrink:0,cursor:input.trim()&&!sending?'pointer':'default' }}>
              {sending
                ? <span className="spin" style={{ width:13,height:13,borderWidth:2 }} />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M5 12l14-9-9 14-.5-5.5z"/></svg>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Panel Preview */}
      <div className="editor-preview-panel">
        <div style={{ position:'absolute',top:0,left:0,right:0,padding:'12px 20px',borderBottom:'1px solid var(--b0)',background:'var(--c1)',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:10 }}>
          <div>
            <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'var(--t3)' }}>Vista Previa Móvil</div>
            <div style={{ fontSize:12,color:'var(--t2)',marginTop:1 }}>{project?.nombre_proyecto ?? 'Proyecto'}</div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            {versionDetalle && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:10,color:'var(--pl)',background:'rgba(124,58,237,0.1)',border:'1px solid var(--bp)',borderRadius:4,padding:'2px 8px',fontWeight:700 }}>
                  v{versionDetalle.numero_version}
                </span>
                <button onClick={() => setShowActions(true)}
                  style={{ fontSize:10,padding:'2px 8px',borderRadius:4,border:'1px solid var(--b1)',background:'var(--c2)',color:'var(--t2)',cursor:'pointer',fontWeight:600 }}>
                  Acciones
                </button>
              </div>
            )}
            <button onClick={loadVersionDetail} style={{ color:'var(--t2)',display:'flex',padding:4 }} title="Actualizar preview">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.44-4.86L23 10"/></svg>
            </button>
          </div>
        </div>

        <div style={{ paddingTop:56,height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <PhoneFrame version={versionDetalle} loading={versionLoading} projectName={project?.nombre_proyecto ?? 'Mi App'} />
        </div>
      </div>

      {/* Modal Exportar */}
      {showExport && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowExport(false) }}>
          <div className="sheet">
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
              <button style={{ color:'var(--t2)',fontSize:16 }} onClick={() => setShowExport(false)}>×</button>
              <span style={{ fontWeight:600,fontSize:14 }}>Exportar Proyecto</span>
              <span style={{ width:16 }} />
            </div>
            <div style={{ textAlign:'center',padding:'16px 0 20px' }}>
              <h2 style={{ fontSize:21,fontWeight:700,marginBottom:6 }}>Exporta tu Creación</h2>
              <p style={{ color:'var(--t2)',fontSize:12,lineHeight:1.5 }}>
                Selecciona el método de entrega para tu proyecto.
              </p>
            </div>
            {[
              { key:'assets',  title:'Descargar Assets',     desc:'ZIP listo para producción con HTML, CSS y JS.' },
              { key:'publish', title:'Publicar Directamente', desc:'Despliega en App Store o Google Play con nuestro pipeline.' },
            ].map(opt => (
              <button key={opt.key} className="card"
                style={{ padding:'14px',width:'100%',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:12,marginBottom:10,borderColor:exportType===opt.key?'var(--bp)':'var(--b0)',background:exportType===opt.key?'var(--pg)':'var(--c2)' }}
                onClick={() => setExportType(opt.key as 'assets'|'publish')}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600,fontSize:13,marginBottom:3 }}>{opt.title}</div>
                  <div style={{ color:'var(--t2)',fontSize:11,lineHeight:1.4 }}>{opt.desc}</div>
                </div>
                <div style={{ width:16,height:16,borderRadius:'50%',border:`2px solid ${exportType===opt.key?'var(--pm)':'var(--b1)'}`,background:exportType===opt.key?'var(--pm)':'transparent',flexShrink:0 }} />
              </button>
            ))}
            <button className="btn btn-p" style={{ width:'100%' }} onClick={handleExport} disabled={exporting || !versionDetalle}>
              {exporting ? <span className="spin" /> : 'PROCEDER'}
            </button>
            {!versionDetalle && <p style={{ textAlign:'center',fontSize:11,color:'var(--t3)',marginTop:8 }}>Aún no hay versión generada</p>}
            <button style={{ width:'100%',marginTop:10,color:'var(--t2)',fontSize:12,textAlign:'center',display:'block' }}
              onClick={() => setShowExport(false)}>Cancelar</button>
          </div>
        </div>
      )}
      {/* Modal Acciones de Proyecto */}
      {showActions && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowActions(false) }}>
          <div className="sheet">
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
              <button style={{ color:'var(--t2)',fontSize:16 }} onClick={() => setShowActions(false)}>×</button>
              <span style={{ fontWeight:600,fontSize:14 }}>Acciones del Proyecto</span>
              <span style={{ width:16 }} />
            </div>

            {versionDetalle && (
              <div style={{ background:'var(--c2)',borderRadius:'var(--rs)',padding:'12px 14px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span style={{ fontSize:12,color:'var(--t2)' }}>Estado actual</span>
                <StateChip estado={versionDetalle.estado_generacion} />
              </div>
            )}

            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              <button className="btn"
                style={{ background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',color:'#10b981',width:'100%',justifyContent:'center',gap:8 }}
                onClick={() => handleProjectAction('validar')}
                disabled={!!actionLoading || versionDetalle?.estado_generacion === 'validada'}>
                {actionLoading === 'validar'
                  ? <span className="spin" />
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                Validar versión
              </button>

              <button className="btn"
                style={{ background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',color:'#f59e0b',width:'100%',justifyContent:'center',gap:8 }}
                onClick={() => handleProjectAction('rechazar')}
                disabled={!!actionLoading || versionDetalle?.estado_generacion === 'rechazada'}>
                {actionLoading === 'rechazar'
                  ? <span className="spin" />
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                Rechazar versión
              </button>

              <div style={{ height:1,background:'var(--b0)',margin:'4px 0' }} />

              <button className="btn btn-d"
                style={{ width:'100%',justifyContent:'center',gap:8 }}
                onClick={() => handleProjectAction('eliminar')}
                disabled={!!actionLoading}>
                {actionLoading === 'eliminar'
                  ? <span className="spin" />
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>}
                Eliminar proyecto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
