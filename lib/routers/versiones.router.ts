import { SupabaseClient } from '@supabase/supabase-js'
import { VersionesService } from '@/lib/services'
import { VersionAplicacion } from '@/lib/types/database.types'

export class VersionesRouter {
  private versionesService: VersionesService

  constructor(private db: SupabaseClient) {
    this.versionesService = new VersionesService(db)
  }

  async listarPorProyecto(proyecto_id: string): Promise<VersionAplicacion[]> {
    return this.versionesService.listarPorProyecto(proyecto_id)
  }

  async obtenerUltima(proyecto_id: string): Promise<VersionAplicacion | null> {
    return this.versionesService.obtenerUltima(proyecto_id)
  }

  async obtenerConPantallas(version_id: string) {
    return this.versionesService.obtenerConPantallas(version_id)
  }

  async validar(version_id: string): Promise<VersionAplicacion> {
    return this.versionesService.validar(version_id)
  }

  async rechazar(version_id: string): Promise<VersionAplicacion> {
    return this.versionesService.rechazar(version_id)
  }

  async registrarPreview(version_id: string, url_preview: string, storage_path?: string) {
    return this.versionesService.registrarPreview(version_id, url_preview, storage_path)
  }

  async obtenerPreviewActivo(version_id: string) {
    return this.versionesService.obtenerPreviewActivo(version_id)
  }
}
