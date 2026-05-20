import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/require-user'
import { ProyectosService } from '@/lib/services'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id }  = await params
    const { db }  = await requireUser()
    const data    = await new ProyectosService(db).obtener(id)
    if (!data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const { db } = await requireUser()
    const data   = await new ProyectosService(db).actualizar(id, await req.json())
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const { db } = await requireUser()
    await new ProyectosService(db).eliminar(id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}
