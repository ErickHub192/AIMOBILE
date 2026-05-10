'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Mensaje = {
  id: string
  emisor: 'usuario' | 'ia' | 'sistema'
  contenido: string
  tipo_mensaje: string
  orden_mensaje: number
}

type Pantalla = {
  id: string
  nombre_pantalla: string
  tipo_pantalla: string
  orden_visual: number
  descripcion_funcional: string | null
}

type VersionConPantallas = {
  id: string
  numero_version: string
  descripcion_version: string | null
  framework_objetivo: string | null
  ruta_codigo_fuente: string | null
  estado_generacion: string
  pantallas: Pantalla[]
}

type Proyecto = {
  id: string
  nombre_proyecto: string
  descripcion_inicial: string | null
  estado: string
}

type EstadoChat = {
  proyecto: Proyecto
  historial: Mensaje[]
  ultimaVersion: VersionConPantallas | null
}

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }

export default function ProyectoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const projectId = params.id
  const [estado, setEstado] = useState<EstadoChat | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  async function cargar() {
    setError('')
    setLoading(true)
    const response = await fetch(`/api/proyectos/${projectId}/chat`)
    const payload = (await response.json()) as ApiResponse<EstadoChat>
    setLoading(false)

    if (!payload.ok) {
      setError(payload.error)
      if (response.status === 401) router.push('/login')
      return
    }

    setEstado(payload.data)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargar()
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function enviar(event: FormEvent) {
    event.preventDefault()
    if (!mensaje.trim()) return
    setSending(true)
    setError('')

    const response = await fetch(`/api/proyectos/${projectId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: mensaje }),
    })

    const payload = (await response.json()) as ApiResponse<EstadoChat>
    setSending(false)

    if (!payload.ok) {
      setError(payload.error)
      return
    }

    setMensaje('')
    setEstado(payload.data)
  }

  async function cambiarEstadoVersion(accion: 'validar' | 'rechazar') {
    const versionId = estado?.ultimaVersion?.id
    if (!versionId) return

    const response = await fetch(`/api/versiones/${versionId}/${accion}`, { method: 'POST' })
    const payload = (await response.json()) as ApiResponse<unknown>
    if (!payload.ok) {
      setError(payload.error)
      return
    }
    await cargar()
  }

  const codigo = estado?.ultimaVersion?.ruta_codigo_fuente ?? ''
  const codigoRecortado = useMemo(() => {
    if (!codigo) return 'Aún no existe código generado por el backend.'
    return codigo.length > 1800 ? `${codigo.slice(0, 1800)}\n\n... código recortado en la vista ...` : codigo
  }, [codigo])

  return (
    <main className="min-h-screen px-5 py-6">
      <header className="mx-auto mb-6 flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 font-black text-slate-950">S</span>
          <div>
            <h1 className="text-xl font-black">Snitch</h1>
            <p className="text-xs text-slate-400">Editor conectado al backend</p>
          </div>
        </Link>
        <div className="flex gap-2">
          <Link href="/dashboard" className="boton-secundario px-4 py-2 text-sm">
            Proyectos
          </Link>
          <Link href={`/proyectos/${projectId}/exportar`} className="boton-principal px-4 py-2 text-sm">
            Exportar
          </Link>
        </div>
      </header>

      {loading && <p className="mx-auto max-w-7xl text-slate-300">Cargando información desde Supabase...</p>}
      {error && <p className="mx-auto mb-5 max-w-7xl rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}

      {estado && (
        <section className="mx-auto grid w-full max-w-7xl gap-5 xl:grid-cols-[0.95fr_1.05fr_0.9fr]">
          <aside className="panel flex min-h-[76vh] flex-col rounded-[2rem] p-5">
            <p className="text-sm font-bold text-cyan-300">Proyecto</p>
            <h2 className="mt-1 text-2xl font-black">{estado.proyecto.nombre_proyecto}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{estado.proyecto.descripcion_inicial || 'Sin descripción inicial'}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.05] p-4">
                <p className="text-xs text-slate-400">Estado</p>
                <p className="mt-1 text-sm font-black text-cyan-200">{estado.proyecto.estado}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.05] p-4">
                <p className="text-xs text-slate-400">Mensajes</p>
                <p className="mt-1 text-sm font-black text-cyan-200">{estado.historial.length}</p>
              </div>
            </div>

            <div className="mt-5 flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/45 p-3 scroll-suave">
              {estado.historial.length === 0 && <p className="p-4 text-sm text-slate-400">Aún no hay mensajes.</p>}
              {estado.historial.map((item) => (
                <div key={item.id} className={`mb-3 rounded-3xl p-4 ${item.emisor === 'usuario' ? 'bg-cyan-400/15' : 'bg-white/[0.06]'}`}>
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                    {item.emisor === 'usuario' ? 'Usuario' : 'IA / Backend'}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{item.contenido}</p>
                </div>
              ))}
            </div>

            <form onSubmit={enviar} className="mt-4 space-y-3">
              <textarea
                className="campo min-h-28 px-4 py-3"
                value={mensaje}
                onChange={(event) => setMensaje(event.target.value)}
                placeholder="Pide cambios o confirma que genere el código. El mensaje se envía al ChatRouter."
              />
              <button className="boton-principal w-full px-5 py-3" disabled={sending}>
                {sending ? 'Enviando al backend...' : 'Enviar mensaje'}
              </button>
            </form>
          </aside>

          <section className="panel rounded-[2rem] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-cyan-300">Versión generada</p>
                <h2 className="mt-1 text-2xl font-black">{estado.ultimaVersion?.numero_version ?? 'Sin versión'}</h2>
              </div>
              {estado.ultimaVersion && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                  {estado.ultimaVersion.estado_generacion}
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Framework</p>
                <p className="mt-2 font-bold text-slate-100">{estado.ultimaVersion?.framework_objetivo ?? 'Pendiente'}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pantallas</p>
                <p className="mt-2 font-bold text-slate-100">{estado.ultimaVersion?.pantallas.length ?? 0}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <p className="mb-3 text-sm font-black text-slate-200">Pantallas entregadas por el backend</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {estado.ultimaVersion?.pantallas.map((pantalla) => (
                  <div key={pantalla.id} className="rounded-2xl bg-white/[0.05] p-4">
                    <p className="font-black">{pantalla.orden_visual}. {pantalla.nombre_pantalla}</p>
                    <p className="mt-1 text-xs text-slate-400">{pantalla.tipo_pantalla}</p>
                  </div>
                ))}
                {!estado.ultimaVersion?.pantallas.length && <p className="text-sm text-slate-400">La IA todavía no registró pantallas.</p>}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => cambiarEstadoVersion('validar')}
                disabled={!estado.ultimaVersion}
                className="boton-principal flex-1 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Validar versión
              </button>
              <button
                onClick={() => cambiarEstadoVersion('rechazar')}
                disabled={!estado.ultimaVersion}
                className="boton-secundario flex-1 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Rechazar
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/35 p-4">
              <p className="mb-3 text-sm font-black text-slate-200">Código recibido desde la última versión</p>
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-300 scroll-suave">
                {codigoRecortado}
              </pre>
            </div>
          </section>

          <aside className="panel rounded-[2rem] p-5">
            <p className="text-sm font-bold text-cyan-300">Vista estética</p>
            <h2 className="mt-1 text-2xl font-black">Resultado de backend</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Esta vista no inventa la app. Solo representa las pantallas y datos que ya fueron guardados por el backend.
            </p>

            <div className="mx-auto mt-6 w-full max-w-[310px] rounded-[2.4rem] border border-white/15 bg-slate-950 p-3 shadow-2xl shadow-black/40">
              <div className="min-h-[590px] rounded-[1.8rem] bg-gradient-to-b from-slate-900 to-slate-950 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">App generada</p>
                    <p className="text-lg font-black">{estado.proyecto.nombre_proyecto}</p>
                  </div>
                  <span className="h-9 w-9 rounded-full bg-cyan-400/20" />
                </div>

                <div className="rounded-3xl bg-cyan-400 p-4 text-slate-950">
                  <p className="text-xs font-black uppercase">Versión</p>
                  <p className="mt-1 text-2xl font-black">{estado.ultimaVersion?.numero_version ?? 'Pendiente'}</p>
                  <p className="mt-2 text-xs font-bold opacity-70">
                    {estado.ultimaVersion ? 'Generada por IAService' : 'Espera el código generado por el backend'}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {(estado.ultimaVersion?.pantallas ?? []).slice(0, 5).map((pantalla) => (
                    <div key={pantalla.id} className="rounded-2xl bg-white/[0.06] p-4">
                      <p className="font-black">{pantalla.nombre_pantalla}</p>
                      <p className="mt-1 text-xs text-slate-400">Pantalla registrada en Supabase</p>
                    </div>
                  ))}
                  {!estado.ultimaVersion?.pantallas.length && (
                    <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-slate-400">
                      Sin pantallas registradas todavía.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </section>
      )}
    </main>
  )
}
