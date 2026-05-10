import { SupabaseClient, User } from '@supabase/supabase-js'
import { ProyectosRouter, VersionesRouter } from '@/lib/routers'
import { UsuariosRepository } from '@/lib/repositories'
import { createAdminClient } from '@/lib/supabase/admin'
import { Proyecto, VersionAplicacion } from '@/lib/types/database.types'

export async function requireUser(db: SupabaseClient): Promise<User> {
  const {
    data: { user },
    error,
  } = await db.auth.getUser()

  if (error || !user) throw new Error('No hay una sesión activa')
  return user
}

export function getBackendDb(fallbackDb: SupabaseClient): SupabaseClient {
  const hasAdminKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  return hasAdminKey ? createAdminClient() : fallbackDb
}

export async function ensureUserProfile(db: SupabaseClient, user: User) {
  const backendDb = getBackendDb(db)
  const repo = new UsuariosRepository(backendDb)
  const existing = await repo.findById(user.id)
  if (existing) return existing

  const metadataName = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : undefined
  const metadataFullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined
  const emailName = user.email ? user.email.split('@')[0] : 'Usuario'

  return repo.upsert({
    id: user.id,
    nombre: metadataName || metadataFullName || emailName,
  })
}

export async function requireOwnedProject(db: SupabaseClient, projectId: string, userId: string): Promise<Proyecto> {
  const backendDb = getBackendDb(db)
  const router = new ProyectosRouter(backendDb)
  const proyecto = await router.obtener(projectId)

  if (!proyecto) throw new Error('Proyecto no encontrado')
  if (proyecto.usuario_id !== userId) throw new Error('No tienes permisos para este proyecto')

  return proyecto
}

export async function requireOwnedVersion(
  db: SupabaseClient,
  versionId: string,
  userId: string
): Promise<VersionAplicacion> {
  const backendDb = getBackendDb(db)
  const versionesRouter = new VersionesRouter(backendDb)
  const version = await versionesRouter.obtenerConPantallas(versionId)

  await requireOwnedProject(backendDb, version.proyecto_id, userId)
  return version
}
