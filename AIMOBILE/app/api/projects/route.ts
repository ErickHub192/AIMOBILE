import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/require-user'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProyectosService } from '@/lib/services'

export async function GET() {
  try {
    const { user, db } = await requireUser()
    const data = await new ProyectosService(db).listarPorUsuario(user.id)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, db } = await requireUser()
    const { nombre_proyecto, descripcion_inicial } = await req.json()

    if (!nombre_proyecto?.trim())
      return NextResponse.json({ error: 'El nombre del proyecto es requerido' }, { status: 400 })

    // Garantiza fila en public.usuarios antes del FK de proyectos
    await createAdminClient()
      .from('usuarios')
      .upsert(
        { id: user.id, nombre: user.email?.split('@')[0] ?? 'Arquitecto' },
        { onConflict: 'id', ignoreDuplicates: true }
      )

    const data = await new ProyectosService(db).crear(
      user.id,
      nombre_proyecto.trim(),
      descripcion_inicial?.trim() || undefined
    )
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (e: any) {
    console.error('[POST /api/projects]', e.message)
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}
