import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExportRouter } from '@/lib/routers'
import { getBackendDb, requireOwnedProject, requireUser } from '@/lib/api/auth'
import { fail, getErrorMessage } from '@/lib/api/responses'

type Context = { params: Promise<{ id: string; apkId: string }> }

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id, apkId } = await context.params
    const db = await createClient()
    const user = await requireUser(db)
    const backendDb = getBackendDb(db)
    await requireOwnedProject(backendDb, id, user.id)

    const router = new ExportRouter(backendDb)
    const download = await router.prepararDescarga(id, apkId)

    const body = typeof download.body === 'string' ? download.body : new Uint8Array(download.body)

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': download.mimeType,
        'Content-Disposition': `attachment; filename="${download.fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return fail(getErrorMessage(error), 400)
  }
}
