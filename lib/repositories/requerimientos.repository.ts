import { SupabaseClient } from '@supabase/supabase-js'
import { Requerimiento, RequerimientoEstado, RequerimientoPrioridad, RequerimientoTipo } from '@/lib/types/database.types'

type CreateRequerimiento = Pick<Requerimiento, 'proyecto_id' | 'tipo_requerimiento' | 'descripcion'> &
  Partial<Pick<Requerimiento, 'mensaje_origen_id' | 'prioridad' | 'estado'>>

export class RequerimientosRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<Requerimiento | null> {
    const { data, error } = await this.db
      .from('requerimientos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async findByProyecto(proyecto_id: string): Promise<Requerimiento[]> {
    const { data, error } = await this.db
      .from('requerimientos')
      .select('*')
      .eq('proyecto_id', proyecto_id)
      .order('fecha_registro', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async findByProyectoAndTipo(proyecto_id: string, tipo: RequerimientoTipo): Promise<Requerimiento[]> {
    const { data, error } = await this.db
      .from('requerimientos')
      .select('*')
      .eq('proyecto_id', proyecto_id)
      .eq('tipo_requerimiento', tipo)
      .order('prioridad', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async create(payload: CreateRequerimiento): Promise<Requerimiento> {
    const { data, error } = await this.db
      .from('requerimientos')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, payload: Partial<Pick<Requerimiento, 'descripcion' | 'prioridad' | 'estado'>>): Promise<Requerimiento> {
    const { data, error } = await this.db
      .from('requerimientos')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEstado(id: string, estado: RequerimientoEstado): Promise<Requerimiento> {
    return this.update(id, { estado })
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('requerimientos')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
