export type UserRol = 'usuario' | 'admin'
export type UserEstado = 'activo' | 'inactivo' | 'suspendido'

export type ProyectoEstado = 'definido' | 'en_desarrollo' | 'en_pruebas' | 'finalizado' | 'cancelado'

export type ConversacionEstado = 'activa' | 'cerrada' | 'archivada'

export type MensajeEmisor = 'usuario' | 'ia' | 'sistema'
export type MensajeTipo = 'consulta' | 'respuesta' | 'sugerencia' | 'validacion' | 'error' | 'sistema'

export type RequerimientoTipo = 'funcional' | 'no_funcional'
export type RequerimientoPrioridad = 'alta' | 'media' | 'baja'
export type RequerimientoEstado = 'pendiente' | 'aprobado' | 'implementado' | 'descartado'

export type IteracionEstado = 'abierta' | 'en_proceso' | 'cerrada'

export type VersionEstadoGeneracion = 'generada' | 'validada' | 'rechazada' | 'en_revision'

export type PantallaEstado = 'activa' | 'modificada' | 'eliminada'

export type PreviewEstado = 'disponible' | 'expirado' | 'eliminado'

export type ApkEstado = 'generado' | 'descargado' | 'fallido'

export interface Usuario {
  id: string
  nombre: string
  rol: UserRol
  estado: UserEstado
  fecha_registro: string
  created_at: string
  updated_at: string
}

export interface Proyecto {
  id: string
  usuario_id: string
  nombre_proyecto: string
  descripcion_inicial: string | null
  objetivo: string | null
  fecha_inicio: string | null
  fecha_fin_estimada: string | null
  estado: ProyectoEstado
  presupuesto_estimado: number | null
  created_at: string
  updated_at: string
}

export interface Conversacion {
  id: string
  proyecto_id: string
  titulo_conversacion: string | null
  fecha_creacion: string
  fecha_ultima_actualizacion: string
  estado: ConversacionEstado
  created_at: string
  updated_at: string
}

export interface Mensaje {
  id: string
  conversacion_id: string
  emisor: MensajeEmisor
  contenido: string
  tipo_mensaje: MensajeTipo
  fecha_envio: string
  orden_mensaje: number
  created_at: string
}

export interface Requerimiento {
  id: string
  proyecto_id: string
  mensaje_origen_id: string | null
  tipo_requerimiento: RequerimientoTipo
  descripcion: string
  prioridad: RequerimientoPrioridad
  estado: RequerimientoEstado
  fecha_registro: string
  created_at: string
  updated_at: string
}

export interface Iteracion {
  id: string
  proyecto_id: string
  numero_iteracion: number
  objetivo_iteracion: string | null
  comentarios_usuario: string | null
  fecha_inicio: string
  fecha_cierre: string | null
  estado: IteracionEstado
  created_at: string
  updated_at: string
}

export interface VersionAplicacion {
  id: string
  proyecto_id: string
  iteracion_id: string | null
  numero_version: string
  descripcion_version: string | null
  framework_objetivo: string | null
  ruta_codigo_fuente: string | null
  estado_generacion: VersionEstadoGeneracion
  fecha_generacion: string
  created_at: string
  updated_at: string
}

export interface Pantalla {
  id: string
  version_id: string
  nombre_pantalla: string
  tipo_pantalla: string
  orden_visual: number
  descripcion_funcional: string | null
  estado: PantallaEstado
  created_at: string
  updated_at: string
}

export interface Preview {
  id: string
  version_id: string
  url_preview: string | null
  storage_path: string | null
  fecha_generacion: string
  fecha_expiracion: string | null
  estado: PreviewEstado
  created_at: string
  updated_at: string
}

export interface ApkGenerado {
  id: string
  version_id: string
  nombre_archivo: string
  ruta_archivo: string | null
  storage_path: string | null
  version_code: number | null
  version_name: string | null
  tamano_mb: number | null
  fecha_generacion: string
  estado: ApkEstado
  created_at: string
  updated_at: string
}
