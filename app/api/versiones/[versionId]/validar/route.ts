import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VersionesRouter } from '@/lib/routers'
import { getBackendDb, requireOwnedVersion, requireUser } from '@/lib/api/auth'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'

type Context = { params: Promise<{ versionId: string }> }

export async function POST(_request: NextRequest, context: Context) {
  try {
    const { versionId } = await context.params
    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    await requireOwnedVersion(backendDb, versionId, user.id)

    const router = new VersionesRouter(backendDb)
    const version = await router.validar(versionId)

    return ok({ version })
  } catch (error) {
    return fail(getErrorMessage(error), 400)
  }
}
