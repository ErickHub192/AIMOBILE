import Link from 'next/link'

export function BarraSuperior() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/20">
          S
        </span>
        <div>
          <p className="text-lg font-black tracking-tight">Snitch</p>
          <p className="text-xs text-slate-400">Generador móvil asistido por IA</p>
        </div>
      </Link>
      <nav className="hidden items-center gap-2 md:flex">
        <Link className="boton-secundario px-5 py-2 text-sm" href="/login">
          Iniciar sesión
        </Link>
        <Link className="boton-principal px-5 py-2 text-sm" href="/registro">
          Crear cuenta
        </Link>
      </nav>
    </header>
  )
}
