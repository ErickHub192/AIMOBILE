import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/require-user'
import { ChatService } from '@/lib/services'

type Ctx = { params: Promise<{ projectId: string }> }

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { projectId } = await params
    const { db } = await requireUser()
    const data = await new ChatService(db).obtenerHistorial(projectId)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { projectId } = await params
    const { contenido } = await req.json()
    const { db } = await requireUser()
    const data = await new ChatService(db).enviarMensaje(projectId, contenido)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('[POST /api/chat]', e.message)
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}
