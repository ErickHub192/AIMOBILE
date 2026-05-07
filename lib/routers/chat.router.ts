import { SupabaseClient } from '@supabase/supabase-js'
import { ChatService } from '@/lib/services'
import { Mensaje } from '@/lib/types/database.types'

export class ChatRouter {
  private chatService: ChatService

  constructor(private db: SupabaseClient) {
    this.chatService = new ChatService(db)
  }

  async enviarMensaje(proyecto_id: string, contenido: string): Promise<Mensaje> {
    return this.chatService.enviarMensaje(proyecto_id, contenido)
  }

  async obtenerHistorial(proyecto_id: string): Promise<Mensaje[]> {
    return this.chatService.obtenerHistorial(proyecto_id)
  }
}
