import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthRouter } from '@/lib/routers'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'
import { readJson, readTextField } from '@/lib/api/body'

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    const nombre = readTextField(body, 'nombre')
    const email = readTextField(body, 'email')
    const password = readTextField(body, 'password')

    if (!nombre) return fail('El nombre es obligatorio', 422)
    if (!email) return fail('El correo es obligatorio', 422)
    if (!password || password.length < 6) return fail('La contraseña debe tener al menos 6 caracteres', 422)

    const db = await createClient()
    const router = new AuthRouter(db)
    const usuario = await router.registrar(email, password, nombre)

    return ok({ usuario })
  } catch (error) {
    return fail(getErrorMessage(error), 400)
  }
}
