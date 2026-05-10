import Link from 'next/link'
import { BarraSuperior } from './componentes/BarraSuperior'

const pasos = [
  'Describe tu aplicación móvil en lenguaje natural.',
  'El backend procesa el mensaje usando los routers, servicios y la IA.',
  'Supabase guarda proyectos, conversación, mensajes, versiones y pantallas.',
  'El frontend solo muestra la información recibida desde la API.',
]

export default function Home() {
  return (
    <main className="min-h-screen">
      <BarraSuperior />
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200">
            MVP conectado al backend del proyecto
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Crea apps móviles desde un chat con <span className="text-cyan-300">Snitch</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Esta interfaz consume los endpoints del backend y no genera por su cuenta. La lógica de proyectos,
            conversación, versiones, pantallas y exportaciones se ejecuta mediante los routers y servicios del repositorio.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/registro" className="boton-principal px-7 py-4 text-center">
              Empezar proyecto
            </Link>
            <Link href="/login" className="boton-secundario px-7 py-4 text-center">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <div className="panel rounded-[2rem] p-5">
          <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/75 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-300">Flujo real</p>
                <h2 className="text-2xl font-black">Frontend → API → Router → Servicio → Supabase</h2>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                Activo
              </span>
            </div>
            <div className="space-y-3">
              {pasos.map((paso, index) => (
                <div key={paso} className="flex gap-3 rounded-2xl bg-white/[0.04] p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-400 font-black text-slate-950">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-300">{paso}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
