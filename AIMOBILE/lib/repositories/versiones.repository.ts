import { SupabaseClient } from '@supabase/supabase-js'
import { VersionAplicacion, VersionEstadoGeneracion } from '@/lib/types/database.types'

type CreateVersion = Pick<VersionAplicacion, 'proyecto_id' | 'numero_version'> &
  Partial<Pick<VersionAplicacion, 'iteracion_id' | 'descripcion_version' | 'framework_objetivo' | 'ruta_codigo_fuente'>>

export class VersionesRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<VersionAplicacion | null> {
    const { data, error } = await this.db
      .from('versiones_aplicacion')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async findByProyecto(proyecto_id: string): Promise<VersionAplicacion[]> {
    const { data, error } = await this.db
      .from('versiones_aplicacion')
      .select('*')
      .eq('proyecto_id', proyecto_id)
      .order('fecha_generacion', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async findLatest(proyecto_id: string): Promise<VersionAplicacion | null> {
    const { data, error } = await this.db
      .from('versiones_aplicacion')
      .select('*')
      .eq('proyecto_id', proyecto_id)
      .order('fecha_generacion', { ascending: false })
      .limit(1)
      .single()
    if (error) return null
    return data
  }

  async create(payload: CreateVersion): Promise<VersionAplicacion> {
    const { data, error } = await this.db
      .from('versiones_aplicacion')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, payload: Partial<Pick<VersionAplicacion, 'descripcion_version' | 'estado_generacion' | 'ruta_codigo_fuente' | 'framework_objetivo'>>): Promise<VersionAplicacion> {
    const { data, error } = await this.db
      .from('versiones_aplicacion')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEstado(id: string, estado: VersionEstadoGeneracion): Promise<VersionAplicacion> {
    return this.update(id, { estado_generacion: estado })
  }
}
