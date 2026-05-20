import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthService } from '@/lib/services'

export async function POST(req: NextRequest) {
  try {
    const { email, password, nombre } = await req.json()
    // Admin necesario aquí: el usuario aún no tiene sesión para INSERT en public.usuarios
    const user = await new AuthService(createAdminClient()).registrar(email, password, nombre)
    return NextResponse.json({ success: true, data: user })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
