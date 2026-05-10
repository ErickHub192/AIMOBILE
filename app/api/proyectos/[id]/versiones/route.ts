import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VersionesRouter } from '@/lib/routers'
import { getBackendDb, requireOwnedProject, requireUser } from '@/lib/api/auth'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params
    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    await requireOwnedProject(backendDb, id, user.id)

    const router = new VersionesRouter(backendDb)
    const versiones = await router.listarPorProyecto(id)
    const ultima = versiones[0] ? await router.obtenerConPantallas(versiones[0].id) : null

    return ok({ versiones, ultima })
  } catch (error) {
    return fail(getErrorMessage(error), 401)
  }
}
