import { SupabaseClient } from '@supabase/supabase-js'
import { ProyectosService } from '@/lib/services'
import { Proyecto, ProyectoEstado } from '@/lib/types/database.types'

export class ProyectosRouter {
  private proyectosService: ProyectosService

  constructor(private db: SupabaseClient) {
    this.proyectosService = new ProyectosService(db)
  }

  async crear(usuario_id: string, nombre_proyecto: string, descripcion_inicial?: string) {
    return this.proyectosService.crear(usuario_id, nombre_proyecto, descripcion_inicial)
  }

  async listarPorUsuario(usuario_id: string) {
    return this.proyectosService.listarPorUsuario(usuario_id)
  }

  async obtener(id: string) {
    return this.proyectosService.obtener(id)
  }

  async actualizar(id: string, payload: Partial<Pick<Proyecto, 'nombre_proyecto' | 'descripcion_inicial' | 'objetivo' | 'fecha_fin_estimada' | 'presupuesto_estimado'>>) {
    return this.proyectosService.actualizar(id, payload)
  }

  async cambiarEstado(id: string, estado: ProyectoEstado) {
    return this.proyectosService.cambiarEstado(id, estado)
  }

  async eliminar(id: string) {
    return this.proyectosService.eliminar(id)
  }
}
