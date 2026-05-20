import { SupabaseClient } from '@supabase/supabase-js'
import { Mensaje, MensajeEmisor, MensajeTipo } from '@/lib/types/database.types'

type CreateMensaje = Pick<Mensaje, 'conversacion_id' | 'emisor' | 'contenido' | 'orden_mensaje'> &
  Partial<Pick<Mensaje, 'tipo_mensaje'>>

export class MensajesRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<Mensaje | null> {
    const { data, error } = await this.db
      .from('mensajes')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async findByConversacion(conversacion_id: string): Promise<Mensaje[]> {
    const { data, error } = await this.db
      .from('mensajes')
      .select('*')
      .eq('conversacion_id', conversacion_id)
      .order('orden_mensaje', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async getLastOrden(conversacion_id: string): Promise<number> {
    const { data, error } = await this.db
      .from('mensajes')
      .select('orden_mensaje')
      .eq('conversacion_id', conversacion_id)
      .order('orden_mensaje', { ascending: false })
      .limit(1)
      .single()
    if (error) return 0
    return data?.orden_mensaje ?? 0
  }

  async create(payload: CreateMensaje): Promise<Mensaje> {
    const { data, error } = await this.db
      .from('mensajes')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async findByEmisor(conversacion_id: string, emisor: MensajeEmisor): Promise<Mensaje[]> {
    const { data, error } = await this.db
      .from('mensajes')
      .select('*')
      .eq('conversacion_id', conversacion_id)
      .eq('emisor', emisor)
      .order('orden_mensaje', { ascending: true })
    if (error) throw error
    return data ?? []
  }
}
