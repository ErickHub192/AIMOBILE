import { SupabaseClient } from '@supabase/supabase-js'
import { AuthService } from '@/lib/services'

export class AuthRouter {
  private authService: AuthService

  constructor(private db: SupabaseClient) {
    this.authService = new AuthService(db)
  }

  async registrar(email: string, password: string, nombre: string) {
    return this.authService.registrar(email, password, nombre)
  }

  async login(email: string, password: string) {
    return this.authService.login(email, password)
  }

  async loginConGoogle() {
    return this.authService.loginConGoogle()
  }

  async loginConGithub() {
    return this.authService.loginConGithub()
  }

  async logout() {
    return this.authService.logout()
  }

  async getUsuarioActual() {
    return this.authService.getUsuarioActual()
  }

  async recuperarPassword(email: string) {
    return this.authService.recuperarPassword(email)
  }
}
