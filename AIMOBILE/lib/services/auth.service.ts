import { SupabaseClient } from '@supabase/supabase-js'
import { UsuariosRepository } from '@/lib/repositories'
import { Usuario } from '@/lib/types/database.types'

export class AuthService {
  private usuariosRepo: UsuariosRepository

  constructor(private db: SupabaseClient) {
    this.usuariosRepo = new UsuariosRepository(db)
  }

  async registrar(email: string, password: string, nombre: string): Promise<Usuario> {
    const { data, error } = await this.db.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('No se pudo crear el usuario')

    return this.usuariosRepo.create({ id: data.user.id, nombre })
  }

  async login(email: string, password: string) {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async loginConGoogle() {
    const { data, error } = await this.db.auth.signInWithOAuth({ provider: 'google' })
    if (error) throw error
    return data
  }

  async loginConGithub() {
    const { data, error } = await this.db.auth.signInWithOAuth({ provider: 'github' })
    if (error) throw error
    return data
  }

  async logout() {
    const { error } = await this.db.auth.signOut()
    if (error) throw error
  }

  async getUsuarioActual(): Promise<Usuario | null> {
    const { data: { user } } = await this.db.auth.getUser()
    if (!user) return null
    return this.usuariosRepo.findById(user.id)
  }

  async recuperarPassword(email: string) {
    const { error } = await this.db.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    if (error) throw error
  }
}
