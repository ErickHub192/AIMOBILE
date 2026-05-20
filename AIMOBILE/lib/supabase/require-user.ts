import { createClient } from './server'
import { createAdminClient } from './admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

/**
 * Verifica la sesión del usuario con el cliente SSR (valida JWT contra Supabase Auth).
 * Devuelve el usuario autenticado y el cliente admin para operaciones de BD.
 *
 * Por qué admin para BD: el cliente SSR no propaga el JWT al contexto de PostgREST
 * en API routes de Next.js 16, por lo que auth.uid() llega null en las políticas RLS.
 * La seguridad se mantiene al nivel de API route: ninguna operación ocurre sin
 * pasar primero por getUser().
 */
export async function requireUser(): Promise<{ user: User; db: SupabaseClient }> {
  const serverClient = await createClient()
  const { data: { user }, error } = await serverClient.auth.getUser()

  if (error || !user) {
    throw Object.assign(new Error('No autorizado'), { status: 401 })
  }

  return { user, db: createAdminClient() }
}
