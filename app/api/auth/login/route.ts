import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const db = await createClient()
    const { data, error } = await db.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })

    // Admin solo para garantizar el registro en public.usuarios (operación admin legítima)
    if (data.user) {
      await createAdminClient()
        .from('usuarios')
        .upsert(
          { id: data.user.id, nombre: data.user.email?.split('@')[0] ?? 'Arquitecto' },
          { onConflict: 'id', ignoreDuplicates: true }
        )
    }

    return NextResponse.json({ success: true, data: { user: data.user } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
