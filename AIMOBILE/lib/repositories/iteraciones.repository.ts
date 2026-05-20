import { SupabaseClient } from '@supabase/supabase-js'
import { Iteracion, IteracionEstado } from '@/lib/types/database.types'

type CreateIteracion = Pick<Iteracion, 'proyecto_id' | 'numero_iteracion'> &
  Partial<Pick<Iteracion, 'objetivo_iteracion' | 'comentarios_usuario'>>

export class IteracionesRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<Iteracion | null> {
    const { data, error } = await this.db
      .from('iteraciones')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async findByProyecto(proyecto_id: string): Promise<Iteracion[]> {
    const { data, error } = await this.db
      .from('iteraciones')
      .select('*')
      .eq('proyecto_id', proyecto_id)
      .order('numero_iteracion', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async findActiva(proyecto_id: string): Promise<Iteracion | null> {
    const { data, error } = await this.db
      .from('iteraciones')
      .select('*')
      .eq('proyecto_id', proyecto_id)
      .in('estado', ['abierta', 'en_proceso'])
      .order('numero_iteracion', { ascending: false })
      .limit(1)
      .single()
    if (error) return null
    return data
  }

  async getNextNumero(proyecto_id: string): Promise<number> {
    const { data, error } = await this.db
      .from('iteraciones')
      .select('numero_iteracion')
      .eq('proyecto_id', proyecto_id)
      .order('numero_iteracion', { ascending: false })
      .limit(1)
      .single()
    if (error) return 1
    return (data?.numero_iteracion ?? 0) + 1
  }

  async create(payload: CreateIteracion): Promise<Iteracion> {
    const { data, error } = await this.db
      .from('iteraciones')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, payload: Partial<Pick<Iteracion, 'objetivo_iteracion' | 'comentarios_usuario' | 'estado' | 'fecha_cierre'>>): Promise<Iteracion> {
    const { data, error } = await this.db
      .from('iteraciones')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async cerrar(id: string): Promise<Iteracion> {
    return this.update(id, { estado: 'cerrada', fecha_cierre: new Date().toISOString() })
  }
}
