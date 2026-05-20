import { SupabaseClient } from '@supabase/supabase-js'
import { Conversacion, ConversacionEstado } from '@/lib/types/database.types'

export class ConversacionesRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<Conversacion | null> {
    const { data, error } = await this.db
      .from('conversaciones')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async findByProyecto(proyecto_id: string): Promise<Conversacion | null> {
    const { data, error } = await this.db
      .from('conversaciones')
      .select('*')
      .eq('proyecto_id', proyecto_id)
      .single()
    if (error) throw error
    return data
  }

  async create(payload: Pick<Conversacion, 'proyecto_id'> & Partial<Pick<Conversacion, 'titulo_conversacion'>>): Promise<Conversacion> {
    const { data, error } = await this.db
      .from('conversaciones')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, payload: Partial<Pick<Conversacion, 'titulo_conversacion' | 'estado' | 'fecha_ultima_actualizacion'>>): Promise<Conversacion> {
    const { data, error } = await this.db
      .from('conversaciones')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEstado(id: string, estado: ConversacionEstado): Promise<Conversacion> {
    return this.update(id, { estado })
  }

  async touchFechaActualizacion(id: string): Promise<void> {
    await this.update(id, { fecha_ultima_actualizacion: new Date().toISOString() })
  }
}
