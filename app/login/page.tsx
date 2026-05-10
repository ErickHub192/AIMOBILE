'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const payload = (await response.json()) as ApiResponse<unknown>
    setLoading(false)

    if (!payload.ok) {
      setError(payload.error)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="panel w-full max-w-md rounded-[2rem] p-7">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 font-black text-slate-950">S</span>
          <span className="text-xl font-black">Snitch</span>
        </Link>

        <h1 className="text-3xl font-black">Iniciar sesión</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Accede para ver tus proyectos, conversaciones y versiones guardadas en Supabase.
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">Correo</span>
            <input
              className="campo px-4 py-3"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">Contraseña</span>
            <input
              className="campo px-4 py-3"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

          <button className="boton-principal w-full px-5 py-3" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-slate-400">
          Acceso social desactivado en esta entrega. Para evitar errores de proveedores no habilitados, usa correo y contraseña.
        </p>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-bold text-cyan-300">
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  )
}
