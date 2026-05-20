import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/require-user'
import { ExportService } from '@/lib/services'

export async function POST(req: NextRequest) {
  try {
    const { version_id, tipo } = await req.json()
    if (!version_id) return NextResponse.json({ error: 'Falta version_id' }, { status: 400 })

    const { db } = await requireUser()
    const buffer = await new ExportService(db).exportar(version_id, tipo ?? 'assets')

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="snitch-app-${version_id}.zip"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const projectId = new URL(req.url).searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })
    const { db } = await requireUser()
    const data = await new ExportService(db).listarExports(projectId)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}
