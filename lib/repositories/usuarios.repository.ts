import { SupabaseClient } from '@supabase/supabase-js'
import { Usuario, UserEstado } from '@/lib/types/database.types'

export class UsuariosRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<Usuario | null> {
    const { data, error } = await this.db
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  }


  async upsert(payload: Pick<Usuario, 'id' | 'nombre'>): Promise<Usuario> {
    const { data, error } = await this.db
      .from('usuarios')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async create(payload: Pick<Usuario, 'id' | 'nombre'>): Promise<Usuario> {
    const { data, error } = await this.db
      .from('usuarios')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, payload: Partial<Pick<Usuario, 'nombre' | 'rol' | 'estado'>>): Promise<Usuario> {
    const { data, error } = await this.db
      .from('usuarios')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEstado(id: string, estado: UserEstado): Promise<Usuario> {
    return this.update(id, { estado })
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('usuarios')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
