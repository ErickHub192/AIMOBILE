import { SupabaseClient } from '@supabase/supabase-js'
import { ApkGenerado, ApkEstado } from '@/lib/types/database.types'

type CreateApk = Pick<ApkGenerado, 'version_id' | 'nombre_archivo'> &
  Partial<Pick<ApkGenerado, 'ruta_archivo' | 'storage_path' | 'version_code' | 'version_name' | 'tamano_mb'>>

export class ApksRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<ApkGenerado | null> {
    const { data, error } = await this.db
      .from('apks_generados')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async findByVersion(version_id: string): Promise<ApkGenerado[]> {
    const { data, error } = await this.db
      .from('apks_generados')
      .select('*')
      .eq('version_id', version_id)
      .order('fecha_generacion', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async findByProyecto(proyecto_id: string): Promise<ApkGenerado[]> {
    const { data, error } = await this.db
      .from('apks_generados')
      .select('*, versiones_aplicacion!inner(proyecto_id)')
      .eq('versiones_aplicacion.proyecto_id', proyecto_id)
      .order('fecha_generacion', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async create(payload: CreateApk): Promise<ApkGenerado> {
    const { data, error } = await this.db
      .from('apks_generados')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEstado(id: string, estado: ApkEstado): Promise<ApkGenerado> {
    const { data, error } = await this.db
      .from('apks_generados')
      .update({ estado })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
}
