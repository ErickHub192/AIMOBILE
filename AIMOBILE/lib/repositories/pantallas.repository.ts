import { SupabaseClient } from '@supabase/supabase-js'
import { Pantalla, PantallaEstado } from '@/lib/types/database.types'

type CreatePantalla = Pick<Pantalla, 'version_id' | 'nombre_pantalla' | 'tipo_pantalla' | 'orden_visual'> &
  Partial<Pick<Pantalla, 'descripcion_funcional'>>

export class PantallasRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<Pantalla | null> {
    const { data, error } = await this.db
      .from('pantallas')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async findByVersion(version_id: string): Promise<Pantalla[]> {
    const { data, error } = await this.db
      .from('pantallas')
      .select('*')
      .eq('version_id', version_id)
      .neq('estado', 'eliminada')
      .order('orden_visual', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async create(payload: CreatePantalla): Promise<Pantalla> {
    const { data, error } = await this.db
      .from('pantallas')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async createMany(payloads: CreatePantalla[]): Promise<Pantalla[]> {
    const { data, error } = await this.db
      .from('pantallas')
      .insert(payloads)
      .select()
    if (error) throw error
    return data ?? []
  }

  async update(id: string, payload: Partial<Pick<Pantalla, 'nombre_pantalla' | 'descripcion_funcional' | 'orden_visual' | 'estado'>>): Promise<Pantalla> {
    const { data, error } = await this.db
      .from('pantallas')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEstado(id: string, estado: PantallaEstado): Promise<Pantalla> {
    return this.update(id, { estado })
  }
}
