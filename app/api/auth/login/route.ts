import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthRouter } from '@/lib/routers'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'
import { readJson, readTextField } from '@/lib/api/body'

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    const email = readTextField(body, 'email')
    const password = readTextField(body, 'password')

    if (!email) return fail('El correo es obligatorio', 422)
    if (!password) return fail('La contraseña es obligatoria', 422)

    const db = await createClient()
    const router = new AuthRouter(db)
    const session = await router.login(email, password)

    return ok({ session })
  } catch (error) {
    return fail(getErrorMessage(error), 401)
  }
}
