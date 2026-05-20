import { SupabaseClient } from '@supabase/supabase-js'
import { Preview, PreviewEstado } from '@/lib/types/database.types'

type CreatePreview = Pick<Preview, 'version_id'> &
  Partial<Pick<Preview, 'url_preview' | 'storage_path' | 'fecha_expiracion'>>

export class PreviewsRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<Preview | null> {
    const { data, error } = await this.db
      .from('previews')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async findByVersion(version_id: string): Promise<Preview[]> {
    const { data, error } = await this.db
      .from('previews')
      .select('*')
      .eq('version_id', version_id)
      .order('fecha_generacion', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async findDisponibleByVersion(version_id: string): Promise<Preview | null> {
    const { data, error } = await this.db
      .from('previews')
      .select('*')
      .eq('version_id', version_id)
      .eq('estado', 'disponible')
      .order('fecha_generacion', { ascending: false })
      .limit(1)
      .single()
    if (error) return null
    return data
  }

  async create(payload: CreatePreview): Promise<Preview> {
    const { data, error } = await this.db
      .from('previews')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEstado(id: string, estado: PreviewEstado): Promise<Preview> {
    const { data, error } = await this.db
      .from('previews')
      .update({ estado })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
}
