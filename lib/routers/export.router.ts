import { SupabaseClient } from '@supabase/supabase-js'
import { ExportService, ExportTipo } from '@/lib/services'

export class ExportRouter {
  private exportService: ExportService

  constructor(private db: SupabaseClient) {
    this.exportService = new ExportService(db)
  }

  async exportar(version_id: string, tipo: ExportTipo) {
    return this.exportService.exportar(version_id, tipo)
  }

  async listarExports(proyecto_id: string) {
    return this.exportService.listarExports(proyecto_id)
  }

  async marcarDescargado(apk_id: string) {
    return this.exportService.marcarDescargado(apk_id)
  }
}
