import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/require-user'
import { VersionesService } from '@/lib/services'

type Ctx = { params: Promise<{ projectId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { projectId } = await params
    const { accion } = await req.json()
    const { db } = await requireUser()
    const svc = new VersionesService(db)

    const version = await svc.obtenerUltima(projectId)
    if (!version) return NextResponse.json({ error: 'Sin versión generada' }, { status: 404 })

    const data = accion === 'validar'
      ? await svc.validar(version.id)
      : await svc.rechazar(version.id)

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}
