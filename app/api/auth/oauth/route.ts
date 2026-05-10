import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fail, getErrorMessage, ok } from '@/lib/api/responses'
import { readJson, readTextField } from '@/lib/api/body'

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    const provider = readTextField(body, 'provider')

    if (provider !== 'google' && provider !== 'github') {
      return fail('Proveedor OAuth no válido', 422)
    }

    const allowedProviders = (process.env.AUTH_PROVIDERS || '').split(',').map((item) => item.trim())
    if (!allowedProviders.includes(provider)) {
      return fail('El acceso con Google/GitHub está desactivado en esta entrega. Usa correo y contraseña, o configura AUTH_PROVIDERS=google,github y habilita los proveedores en Supabase.', 403)
    }

    const db = await createClient()
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`
    const { data, error } = await db.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })

    if (error) throw error
    return ok({ url: data.url })
  } catch (error) {
    return fail(getErrorMessage(error), 400)
  }
}
