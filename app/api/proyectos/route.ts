import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ChatRouter, ProyectosRouter } from '@/lib/routers'
import { ensureUserProfile, getBackendDb, requireUser } from '@/lib/api/auth'
import { readJson, readTextField } from '@/lib/api/body'
import { fail, getErrorDetails, getErrorMessage, ok } from '@/lib/api/responses'

export async function GET() {
  try {
    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    const router = new ProyectosRouter(backendDb)
    const proyectos = await router.listarPorUsuario(user.id)

    return ok({ proyectos })
  } catch (error) {
    return fail(getErrorMessage(error), 401, getErrorDetails(error))
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    const nombre = readTextField(body, 'nombre_proyecto')
    const descripcion = readTextField(body, 'descripcion_inicial')
    const promptInicial = readTextField(body, 'prompt_inicial')

    if (!nombre) return fail('El nombre del proyecto es obligatorio', 422)

    const db = await createClient()
    const user = await requireUser(db)
    await ensureUserProfile(db, user)

    const backendDb = getBackendDb(db)
    const proyectosRouter = new ProyectosRouter(backendDb)
    const proyecto = await proyectosRouter.crear(user.id, nombre, descripcion || undefined)

    let respuestaInicial = null
    let advertencia = null

    if (promptInicial) {
      try {
        const chatRouter = new ChatRouter(backendDb)
        respuestaInicial = await chatRouter.enviarMensaje(proyecto.id, promptInicial)
      } catch (error) {
        advertencia = `El proyecto se creó, pero falló el primer mensaje de IA: ${getErrorMessage(error)}`
      }
    }

    return ok({ proyecto, respuestaInicial, advertencia }, { status: 201 })
  } catch (error) {
    return fail(getErrorMessage(error), 400, getErrorDetails(error))
  }
}
