import { IAService } from '@/lib/services'
import { IAResponse } from '@/lib/services/ia.service'

export class IARouter {
  private iaService: IAService

  constructor() {
    this.iaService = new IAService()
  }

  async generarAppDesdePrompt(prompt: string): Promise<IAResponse> {
    return this.iaService.generarAppDesdePrompt(prompt)
  }
}
