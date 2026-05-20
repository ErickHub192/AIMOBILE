import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/require-user'
import { VersionesService } from '@/lib/services'

type Ctx = { params: Promise<{ projectId: string }> }

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { projectId } = await params
    const { db } = await requireUser()
    const data = await new VersionesService(db).listarPorProyecto(projectId)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}
