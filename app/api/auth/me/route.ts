import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/require-user'

export async function GET() {
  try {
    const { user, db } = await requireUser()
    const { data: profile } = await db.from('usuarios').select('nombre').eq('id', user.id).single()
    return NextResponse.json({ success: true, data: { ...user, nombre: profile?.nombre } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, db } = await requireUser()
    const { nombre, password_actual, password_nuevo } = await req.json()

    // Actualizar nombre en tabla usuarios
    if (nombre) {
      await db.from('usuarios').update({ nombre }).eq('id', user.id)
    }

    // Cambiar contraseña vía Supabase Auth
    if (password_nuevo) {
      const { error } = await db.auth.updateUser({ password: password_nuevo })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}
