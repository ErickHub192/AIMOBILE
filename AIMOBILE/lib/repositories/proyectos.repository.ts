import { SupabaseClient } from '@supabase/supabase-js'
import { Proyecto, ProyectoEstado } from '@/lib/types/database.types'

type CreateProyecto = Pick<Proyecto, 'usuario_id' | 'nombre_proyecto'> &
  Partial<Pick<Proyecto, 'descripcion_inicial' | 'objetivo' | 'fecha_fin_estimada' | 'presupuesto_estimado'>>

export class ProyectosRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<Proyecto | null> {
    const { data, error } = await this.db
      .from('proyectos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async findByUsuario(usuario_id: string): Promise<Proyecto[]> {
    const { data, error } = await this.db
      .from('proyectos')
      .select('*')
      .eq('usuario_id', usuario_id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async findByUsuarioAndEstado(usuario_id: string, estado: ProyectoEstado): Promise<Proyecto[]> {
    const { data, error } = await this.db
      .from('proyectos')
      .select('*')
      .eq('usuario_id', usuario_id)
      .eq('estado', estado)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async create(payload: CreateProyecto): Promise<Proyecto> {
    const { data, error } = await this.db
      .from('proyectos')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, payload: Partial<Omit<Proyecto, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>>): Promise<Proyecto> {
    const { data, error } = await this.db
      .from('proyectos')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEstado(id: string, estado: ProyectoEstado): Promise<Proyecto> {
    return this.update(id, { estado })
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('proyectos')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
