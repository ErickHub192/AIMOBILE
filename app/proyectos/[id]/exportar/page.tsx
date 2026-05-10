'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Version = {
  id: string
  numero_version: string
  estado_generacion: string
  framework_objetivo: string | null
}

type ExportItem = {
  id: string
  nombre_archivo: string
  version_name: string | null
  estado: string
  fecha_generacion: string
}

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }

export default function ExportarPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const projectId = params.id
  const [versiones, setVersiones] = useState<Version[]>([])
  const [exportsList, setExportsList] = useState<ExportItem[]>([])
  const [versionId, setVersionId] = useState('')
  const [tipo, setTipo] = useState<'assets' | 'publish'>('publish')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  async function cargar() {
    setLoading(true)
    setError('')

    const [versionesResponse, exportResponse] = await Promise.all([
      fetch(`/api/proyectos/${projectId}/versiones`),
      fetch(`/api/proyectos/${projectId}/export`),
    ])

    const versionesPayload = (await versionesResponse.json()) as ApiResponse<{ versiones: Version[] }>
    const exportPayload = (await exportResponse.json()) as ApiResponse<{ exports: ExportItem[] }>
    setLoading(false)

    if (!versionesPayload.ok) {
      setError(versionesPayload.error)
      if (versionesResponse.status === 401) router.push('/login')
      return
    }
    if (!exportPayload.ok) {
      setError(exportPayload.error)
      return
    }

    setVersiones(versionesPayload.data.versiones)
    setExportsList(exportPayload.data.exports)
    setVersionId(versionesPayload.data.versiones[0]?.id ?? '')
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargar()
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function exportar() {
    if (!versionId) return
    setExporting(true)
    setError('')
    setMessage('')

    const response = await fetch(`/api/proyectos/${projectId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version_id: versionId, tipo }),
    })

    const payload = (await response.json()) as ApiResponse<unknown>
    setExporting(false)

    if (!payload.ok) {
      setError(payload.error)
      return
    }

    setMessage('Exportación generada. Ya puedes descargar el archivo desde el historial.')
    await cargar()
  }

  return (
    <main className="min-h-screen px-5 py-6">
      <header className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between gap-4">
        <Link href={`/proyectos/${projectId}`} className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 font-black text-slate-950">S</span>
          <div>
            <h1 className="text-xl font-black">Snitch</h1>
            <p className="text-xs text-slate-400">Exportación desde backend</p>
          </div>
        </Link>
        <Link href={`/proyectos/${projectId}`} className="boton-secundario px-4 py-2 text-sm">
          Volver al editor
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm font-bold text-cyan-300">Exportar</p>
          <h2 className="mt-2 text-3xl font-black">Descargar salida del backend</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Esta pantalla usa ExportRouter. La opción principal genera un proyecto Expo descargable con el App.tsx producido por el backend.
          </p>

          {loading && <p className="mt-6 text-sm text-slate-400">Cargando versiones...</p>}

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Versión</span>
              <select className="campo px-4 py-3" value={versionId} onChange={(event) => setVersionId(event.target.value)}>
                {versiones.map((version) => (
                  <option key={version.id} value={version.id} className="bg-slate-950">
                    {version.numero_version} · {version.estado_generacion}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Tipo</span>
              <select className="campo px-4 py-3" value={tipo} onChange={(event) => setTipo(event.target.value as 'assets' | 'publish')}>
                <option value="publish" className="bg-slate-950">Proyecto Expo descargable (.zip)</option>
                <option value="assets" className="bg-slate-950">Datos de versión y código (.zip)</option>
              </select>
            </label>
          </div>

          {error && <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          {message && <p className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}

          <button className="boton-principal mt-6 w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-40" onClick={exportar} disabled={!versionId || exporting}>
            {exporting ? 'Exportando con backend...' : 'Exportar'}
          </button>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Nota: el archivo descargable se genera desde la versión guardada. Para APK instalable real, abre el ZIP de Expo y compílalo con Expo/EAS o Android Studio.
          </p>
        </div>

        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm font-bold text-cyan-300">Historial</p>
          <h2 className="mt-2 text-3xl font-black">Exportaciones guardadas</h2>

          <div className="mt-6 grid gap-4">
            {exportsList.length === 0 && <p className="rounded-3xl border border-dashed border-white/15 p-8 text-center text-slate-400">Sin exportaciones registradas.</p>}
            {exportsList.map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{item.nombre_archivo}</h3>
                    <p className="mt-1 text-sm text-slate-400">Versión: {item.version_name || 'Sin nombre'}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">{item.estado}</span>
                </div>
                <a
                  href={`/api/proyectos/${projectId}/export/${item.id}/download`}
                  className="boton-secundario mt-4 inline-flex px-4 py-2 text-sm"
                >
                  Descargar archivo
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
