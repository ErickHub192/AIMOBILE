import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ProyectosRouter } from '@/lib/routers'
import { getBackendDb, requireOwnedProject, requireUser } from '@/lib/api/auth'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'
import { readJson, readTextField } from '@/lib/api/body'
import { ProyectoEstado } from '@/lib/types/database.types'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params
    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    const proyecto = await requireOwnedProject(backendDb, id, user.id)

    return ok({ proyecto })
  } catch (error) {
    return fail(getErrorMessage(error), 404)
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params
    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    await requireOwnedProject(backendDb, id, user.id)

    const body = await readJson(request)
    const estado = readTextField(body, 'estado') as ProyectoEstado | ''
    const payload = {
      nombre_proyecto: readTextField(body, 'nombre_proyecto') || undefined,
      descripcion_inicial: readTextField(body, 'descripcion_inicial') || undefined,
      objetivo: readTextField(body, 'objetivo') || undefined,
      fecha_fin_estimada: readTextField(body, 'fecha_fin_estimada') || undefined,
      presupuesto_estimado: typeof body.presupuesto_estimado === 'number' ? body.presupuesto_estimado : undefined,
    }

    const router = new ProyectosRouter(backendDb)
    const proyecto = estado ? await router.cambiarEstado(id, estado) : await router.actualizar(id, payload)

    return ok({ proyecto })
  } catch (error) {
    return fail(getErrorMessage(error), 400)
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params
    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    await requireOwnedProject(backendDb, id, user.id)

    const router = new ProyectosRouter(backendDb)
    await router.eliminar(id)

    return ok({ eliminado: true })
  } catch (error) {
    return fail(getErrorMessage(error), 400)
  }
}
