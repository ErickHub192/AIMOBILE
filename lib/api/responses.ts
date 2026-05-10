import { NextResponse } from 'next/server'

export type ApiOk<T> = { ok: true; data: T }
export type ApiFail = { ok: false; error: string; details?: unknown }

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, init)
}

export function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiFail>({ ok: false, error }, { status })
}

type MaybeSupabaseError = {
  message?: string
  details?: string
  hint?: string
  code?: string
  error_description?: string
  error?: string
  msg?: string
  error_code?: string
}

export function getErrorMessage(error: unknown) {
  let raw = ''
  let code = ''

  if (error instanceof Error) raw = error.message
  else if (typeof error === 'string') raw = error
  else if (error && typeof error === 'object') {
    const e = error as MaybeSupabaseError
    raw = e.message || e.error_description || e.msg || e.error || ''
    code = e.code || e.error_code || ''
  }

  const normalized = raw.toLowerCase()

  if (normalized.includes('row-level security') || code === '42501') {
    return 'Permiso rechazado por Supabase RLS. Verifica que exista SUPABASE_SERVICE_ROLE_KEY en .env.local y reinicia el servidor. Si no existe perfil en public.usuarios, ejecuta supabase/schema.sql.'
  }

  if (normalized.includes('unsupported provider') || normalized.includes('provider is not enabled')) {
    return 'El proveedor OAuth no está habilitado en Supabase. Usa correo y contraseña, o habilita Google/GitHub en Authentication > Providers.'
  }

  if (normalized.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (normalized.includes('email not confirmed')) return 'El correo todavía no está confirmado en Supabase.'
  if (normalized.includes('failed to fetch')) return 'No se pudo conectar con el backend.'
  if (raw) return code ? `${raw} Código: ${code}` : raw

  return 'Error inesperado del servidor'
}

export function getErrorDetails(error: unknown) {
  if (error && typeof error === 'object') {
    const e = error as MaybeSupabaseError
    return {
      code: e.code || e.error_code,
      details: e.details,
      hint: e.hint,
      message: e.message || e.error_description || e.msg || e.error,
    }
  }
  return undefined
}
