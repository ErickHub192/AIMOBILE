import { SupabaseClient } from '@supabase/supabase-js'
import { VersionesRepository, PantallasRepository, PreviewsRepository } from '@/lib/repositories'
import { VersionAplicacion, VersionEstadoGeneracion } from '@/lib/types/database.types'

export class VersionesService {
  private versionesRepo: VersionesRepository
  private pantallasRepo: PantallasRepository
  private previewsRepo: PreviewsRepository

  constructor(private db: SupabaseClient) {
    this.versionesRepo = new VersionesRepository(db)
    this.pantallasRepo = new PantallasRepository(db)
    this.previewsRepo = new PreviewsRepository(db)
  }

  async listarPorProyecto(proyecto_id: string): Promise<VersionAplicacion[]> {
    return this.versionesRepo.findByProyecto(proyecto_id)
  }

  async obtenerUltima(proyecto_id: string): Promise<VersionAplicacion | null> {
    return this.versionesRepo.findLatest(proyecto_id)
  }

  async obtenerConPantallas(version_id: string) {
    const version = await this.versionesRepo.findById(version_id)
    if (!version) throw new Error('Versión no encontrada')
    const pantallas = await this.pantallasRepo.findByVersion(version_id)
    return { ...version, pantallas }
  }

  async validar(version_id: string): Promise<VersionAplicacion> {
    return this.versionesRepo.updateEstado(version_id, 'validada')
  }

  async rechazar(version_id: string): Promise<VersionAplicacion> {
    return this.versionesRepo.updateEstado(version_id, 'rechazada')
  }

  async registrarPreview(version_id: string, url_preview: string, storage_path?: string) {
    return this.previewsRepo.create({ version_id, url_preview, storage_path })
  }

  async obtenerPreviewActivo(version_id: string) {
    return this.previewsRepo.findDisponibleByVersion(version_id)
  }
}
