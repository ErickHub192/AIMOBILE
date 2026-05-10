import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExportRouter } from '@/lib/routers'
import { getBackendDb, requireOwnedProject, requireOwnedVersion, requireUser } from '@/lib/api/auth'
import { readJson, readTextField } from '@/lib/api/body'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'
import { ExportTipo } from '@/lib/services/export.service'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params
    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    await requireOwnedProject(backendDb, id, user.id)

    const router = new ExportRouter(backendDb)
    const exports = await router.listarExports(id)

    return ok({ exports })
  } catch (error) {
    return fail(getErrorMessage(error), 401)
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params
    const body = await readJson(request)
    const tipo = readTextField(body, 'tipo') as ExportTipo | ''
    const versionId = readTextField(body, 'version_id')

    if (tipo !== 'assets' && tipo !== 'publish') return fail('Tipo de exportación no válido', 422)
    if (!versionId) return fail('La versión es obligatoria', 422)

    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    await requireOwnedProject(backendDb, id, user.id)
    const version = await requireOwnedVersion(backendDb, versionId, user.id)
    if (version.proyecto_id !== id) return fail('La versión no pertenece a este proyecto', 403)

    const router = new ExportRouter(backendDb)
    const resultado = await router.exportar(versionId, tipo)

    return ok({ resultado })
  } catch (error) {
    return fail(getErrorMessage(error), 400)
  }
}
