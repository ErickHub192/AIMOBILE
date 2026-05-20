import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/require-user'
import { VersionesService } from '@/lib/services'

type Ctx = { params: Promise<{ projectId: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { projectId } = await params
    const versionId     = new URL(req.url).searchParams.get('versionId')
    const { db }        = await requireUser()
    const service       = new VersionesService(db)

    const ultima = versionId
      ? await service.obtenerConPantallas(versionId)
      : await service.obtenerUltima(projectId)

    if (!ultima) return NextResponse.json({ success: true, data: null })

    const id = (ultima as any).id as string
    const [versionConPantallas, preview] = await Promise.all([
      'pantallas' in ultima ? Promise.resolve(ultima) : service.obtenerConPantallas(id),
      service.obtenerPreviewActivo(id),
    ])
    return NextResponse.json({ success: true, data: { ...versionConPantallas, preview } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}
