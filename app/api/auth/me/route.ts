import { createClient } from '@/lib/supabase/server'
import { AuthRouter } from '@/lib/routers'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'

export async function GET() {
  try {
    const db = await createClient()
    const router = new AuthRouter(db)
    const usuario = await router.getUsuarioActual()
    return ok({ usuario })
  } catch (error) {
    return fail(getErrorMessage(error), 401)
  }
}
