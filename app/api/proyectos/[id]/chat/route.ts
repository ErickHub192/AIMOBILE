import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { ChatRouter, VersionesRouter } from '@/lib/routers'
import { getBackendDb, requireOwnedProject, requireUser } from '@/lib/api/auth'
import { readJson, readTextField } from '@/lib/api/body'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'

type Context = { params: Promise<{ id: string }> }

async function getProjectChatState(db: SupabaseClient, proyectoId: string) {
  const chatRouter = new ChatRouter(db)
  const versionesRouter = new VersionesRouter(db)
  const historial = await chatRouter.obtenerHistorial(proyectoId)
  const ultimaVersion = await versionesRouter.obtenerUltima(proyectoId)
  const versionConPantallas = ultimaVersion ? await versionesRouter.obtenerConPantallas(ultimaVersion.id) : null

  return { historial, ultimaVersion: versionConPantallas }
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params
    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    const proyecto = await requireOwnedProject(backendDb, id, user.id)
    const state = await getProjectChatState(backendDb, id)

    return ok({ proyecto, ...state })
  } catch (error) {
    return fail(getErrorMessage(error), 401)
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params
    const body = await readJson(request)
    const contenido = readTextField(body, 'contenido')

    if (!contenido) return fail('El mensaje no puede estar vacío', 422)

    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    const proyecto = await requireOwnedProject(backendDb, id, user.id)
    const chatRouter = new ChatRouter(backendDb)
    const respuesta = await chatRouter.enviarMensaje(id, contenido)
    const state = await getProjectChatState(backendDb, id)

    return ok({ proyecto, respuesta, ...state })
  } catch (error) {
    return fail(getErrorMessage(error), 400)
  }
}
