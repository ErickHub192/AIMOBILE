'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

type Proyecto = {
  id: string
  nombre_proyecto: string
  descripcion_inicial: string | null
  estado: string
  created_at: string
}

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }

export default function DashboardPage() {
  const router = useRouter()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function cargar() {
    setLoading(true)
    setError('')
    const response = await fetch('/api/proyectos')
    const payload = (await response.json()) as ApiResponse<{ proyectos: Proyecto[] }>
    setLoading(false)

    if (!payload.ok) {
      router.push('/login')
      return
    }

    setProyectos(payload.data.proyectos)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargar()
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function crearProyecto(event: FormEvent) {
    event.preventDefault()
    setCreating(true)
    setError('')

    const response = await fetch('/api/proyectos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_proyecto: nombre,
        descripcion_inicial: descripcion,
        prompt_inicial: prompt,
      }),
    })

    const payload = (await response.json()) as ApiResponse<{ proyecto: Proyecto; advertencia?: string | null }>
    setCreating(false)

    if (!payload.ok) {
      setError(payload.error)
      return
    }

    if (payload.data.advertencia) {
      console.warn(payload.data.advertencia)
    }

    router.push(`/proyectos/${payload.data.proyecto.id}`)
  }

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="min-h-screen px-5 py-6">
      <header className="mx-auto mb-8 flex w-full max-w-7xl items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 font-black text-slate-950">S</span>
          <div>
            <h1 className="text-xl font-black">Snitch</h1>
            <p className="text-xs text-slate-400">Panel de proyectos</p>
          </div>
        </Link>
        <button onClick={cerrarSesion} className="boton-secundario px-5 py-2 text-sm">
          Cerrar sesión
        </button>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={crearProyecto} className="panel rounded-[2rem] p-6">
          <p className="text-sm font-bold text-cyan-300">Nuevo proyecto</p>
          <h2 className="mt-2 text-3xl font-black">Crear app móvil</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Este formulario solo envía datos al backend. El proyecto y la conversación se crean con ProyectosRouter y ChatRouter.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Nombre del proyecto</span>
              <input
                className="campo px-4 py-3"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ejemplo: Recetas móviles"
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Descripción inicial</span>
              <textarea
                className="campo min-h-24 px-4 py-3"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Describe de forma general la app."
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Mensaje inicial para la IA</span>
              <textarea
                className="campo min-h-32 px-4 py-3"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Genera una app de recetas con pantalla principal, categorías, favoritos y detalle de receta."
              />
            </label>
          </div>

          {error && <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

          <button className="boton-principal mt-6 w-full px-5 py-3" disabled={creating}>
            {creating ? 'Creando con backend...' : 'Crear proyecto'}
          </button>
        </form>

        <div className="panel rounded-[2rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-cyan-300">Tus proyectos</p>
              <h2 className="mt-2 text-3xl font-black">Historial guardado</h2>
            </div>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-300">{proyectos.length}</span>
          </div>

          <div className="mt-6 grid gap-4">
            {loading && <p className="text-sm text-slate-400">Cargando proyectos desde Supabase...</p>}
            {!loading && proyectos.length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/15 p-8 text-center text-slate-400">
                Todavía no tienes proyectos. Crea uno desde el formulario.
              </div>
            )}
            {proyectos.map((proyecto) => (
              <Link
                key={proyecto.id}
                href={`/proyectos/${proyecto.id}`}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 hover:border-cyan-300/50 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black">{proyecto.nombre_proyecto}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                      {proyecto.descripcion_inicial || 'Sin descripción inicial'}
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{proyecto.estado}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
