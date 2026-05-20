import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con permisos de service_role.
 * SOLO usar en API routes del servidor, nunca en componentes cliente.
 * Usa SUPABASE_URL (privada) como preferencia; fallback a NEXT_PUBLIC por compatibilidad.
 */
export const createAdminClient = () =>
  createClient(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
