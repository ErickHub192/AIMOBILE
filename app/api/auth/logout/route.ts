import { createClient } from '@/lib/supabase/server'
import { AuthRouter } from '@/lib/routers'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'

export async function POST() {
  try {
    const db = await createClient()
    const router = new AuthRouter(db)
    await router.logout()
    return ok({ message: 'Sesión cerrada' })
  } catch (error) {
    return fail(getErrorMessage(error), 400)
  }
}
