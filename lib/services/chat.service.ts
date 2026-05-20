import { SupabaseClient } from '@supabase/supabase-js'
import {
  MensajesRepository,
  ConversacionesRepository,
  RequerimientosRepository,
  IteracionesRepository,
  VersionesRepository,
  PantallasRepository,
} from '@/lib/repositories'
import { IAService, PantallaIA } from './ia.service'
import { Mensaje } from '@/lib/types/database.types'

export class ChatService {
  private mensajesRepo: MensajesRepository
  private conversacionesRepo: ConversacionesRepository
  private requerimientosRepo: RequerimientosRepository
  private iteracionesRepo: IteracionesRepository
  private versionesRepo: VersionesRepository
  private pantallasRepo: PantallasRepository
  private iaService: IAService

  constructor(private db: SupabaseClient) {
    this.mensajesRepo = new MensajesRepository(db)
    this.conversacionesRepo = new ConversacionesRepository(db)
    this.requerimientosRepo = new RequerimientosRepository(db)
    this.iteracionesRepo = new IteracionesRepository(db)
    this.versionesRepo = new VersionesRepository(db)
    this.pantallasRepo = new PantallasRepository(db)
    this.iaService = new IAService()
  }

  async enviarMensaje(proyecto_id: string, contenido: string): Promise<Mensaje> {
    const conversacion = await this.conversacionesRepo.findByProyecto(proyecto_id)
    if (!conversacion) throw new Error('Conversación no encontrada')

    const historial = await this.mensajesRepo.findByConversacion(conversacion.id)
    const nextOrden = await this.mensajesRepo.getLastOrden(conversacion.id)

    const mensajeUsuario = await this.mensajesRepo.create({
      conversacion_id: conversacion.id,
      emisor: 'usuario',
      contenido,
      tipo_mensaje: 'consulta',
      orden_mensaje: nextOrden + 1,
    })

    const respuestaIA = await this.iaService.chat(contenido, historial)

    const mensajeIA = await this.mensajesRepo.create({
      conversacion_id: conversacion.id,
      emisor: 'ia',
      contenido: respuestaIA.mensaje,
      tipo_mensaje: 'respuesta',
      orden_mensaje: nextOrden + 2,
    })

    await this.conversacionesRepo.touchFechaActualizacion(conversacion.id)

    if (respuestaIA.requerimientos?.length) {
      await Promise.all(
        respuestaIA.requerimientos.map((desc) =>
          this.requerimientosRepo.create({
            proyecto_id,
            mensaje_origen_id: mensajeUsuario.id,
            tipo_requerimiento: 'funcional',
            descripcion: desc,
          })
        )
      )
    }

    if (respuestaIA.codigo) {
      await this.guardarVersion(proyecto_id, respuestaIA.codigo, respuestaIA.pantallas ?? [])
    }

    return mensajeIA
  }

  async obtenerHistorial(proyecto_id: string): Promise<Mensaje[]> {
    const conversacion = await this.conversacionesRepo.findByProyecto(proyecto_id)
    if (!conversacion) return []
    return this.mensajesRepo.findByConversacion(conversacion.id)
  }

  private async guardarVersion(proyecto_id: string, codigo: string, pantallas: PantallaIA[]): Promise<void> {
    const versiones = await this.versionesRepo.findByProyecto(proyecto_id)
    const numero_version = `v${versiones.length + 1}.0`

    const iteracionActiva = await this.iteracionesRepo.findActiva(proyecto_id)
    const iteracion = iteracionActiva ?? await this.iteracionesRepo.create({
      proyecto_id,
      numero_iteracion: await this.iteracionesRepo.getNextNumero(proyecto_id),
    })

    const version = await this.versionesRepo.create({
      proyecto_id,
      iteracion_id: iteracion.id,
      numero_version,
      ruta_codigo_fuente: codigo,
      framework_objetivo: 'React Native (Expo)',
    })

    if (pantallas.length) {
      await this.pantallasRepo.createMany(
        pantallas.map((p, i) => ({
          version_id: version.id,
          nombre_pantalla: p.nombre,
          descripcion_funcional: p.descripcion,
          tipo_pantalla: 'generada',
          orden_visual: i + 1,
        }))
      )
    }
  }
}
