import { SupabaseClient } from '@supabase/supabase-js'
import { ProyectosRepository, ConversacionesRepository } from '@/lib/repositories'
import { Proyecto, ProyectoEstado } from '@/lib/types/database.types'

export class ProyectosService {
  private proyectosRepo: ProyectosRepository
  private conversacionesRepo: ConversacionesRepository

  constructor(private db: SupabaseClient) {
    this.proyectosRepo = new ProyectosRepository(db)
    this.conversacionesRepo = new ConversacionesRepository(db)
  }

  async crear(usuario_id: string, nombre_proyecto: string, descripcion_inicial?: string): Promise<Proyecto> {
    const proyecto = await this.proyectosRepo.create({
      usuario_id,
      nombre_proyecto,
      descripcion_inicial,
    })

    await this.conversacionesRepo.create({
      proyecto_id: proyecto.id,
      titulo_conversacion: nombre_proyecto,
    })

    return proyecto
  }

  async listarPorUsuario(usuario_id: string): Promise<Proyecto[]> {
    return this.proyectosRepo.findByUsuario(usuario_id)
  }

  async obtener(id: string): Promise<Proyecto | null> {
    return this.proyectosRepo.findById(id)
  }

  async actualizar(id: string, payload: Partial<Pick<Proyecto, 'nombre_proyecto' | 'descripcion_inicial' | 'objetivo' | 'fecha_fin_estimada' | 'presupuesto_estimado'>>): Promise<Proyecto> {
    return this.proyectosRepo.update(id, payload)
  }

  async cambiarEstado(id: string, estado: ProyectoEstado): Promise<Proyecto> {
    return this.proyectosRepo.updateEstado(id, estado)
  }

  async eliminar(id: string): Promise<void> {
    return this.proyectosRepo.delete(id)
  }
}
