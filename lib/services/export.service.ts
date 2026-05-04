import { SupabaseClient } from '@supabase/supabase-js'
import { VersionesRepository, ApksRepository } from '@/lib/repositories'

export type ExportTipo = 'assets' | 'publish'

export class ExportService {
  private versionesRepo: VersionesRepository
  private apksRepo: ApksRepository

  constructor(private db: SupabaseClient) {
    this.versionesRepo = new VersionesRepository(db)
    this.apksRepo = new ApksRepository(db)
  }

  async exportar(version_id: string, tipo: ExportTipo) {
    const version = await this.versionesRepo.findById(version_id)
    if (!version) throw new Error('Versión no encontrada')
    if (version.estado_generacion !== 'validada') throw new Error('La versión debe estar validada antes de exportar')

    if (tipo === 'assets') {
      return this.exportarAssets(version_id, version.ruta_codigo_fuente)
    }
    return this.exportarPublish(version_id, version.numero_version)
  }

  private async exportarAssets(version_id: string, codigo: string | null) {
    const nombre_archivo = `app-${version_id}.zip`

    const apk = await this.apksRepo.create({
      version_id,
      nombre_archivo,
      version_name: 'assets',
    })

    return { tipo: 'assets', apk, codigo }
  }

  private async exportarPublish(version_id: string, numero_version: string) {
    const nombre_archivo = `app-${version_id}-release.apk`

    const apk = await this.apksRepo.create({
      version_id,
      nombre_archivo,
      version_name: numero_version,
    })

    return { tipo: 'publish', apk }
  }

  async listarExports(proyecto_id: string) {
    return this.apksRepo.findByProyecto(proyecto_id)
  }

  async marcarDescargado(apk_id: string) {
    return this.apksRepo.updateEstado(apk_id, 'descargado')
  }
}
