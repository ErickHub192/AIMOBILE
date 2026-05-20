import { GoogleGenerativeAI, Tool, FunctionDeclaration } from '@google/generative-ai'
import { Mensaje } from '@/lib/types/database.types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `Eres un arquitecto de apps móviles. Ayudas al usuario a crear apps móviles.

Cuando generes una app:
- Llama SIEMPRE a la tool "crear_app" para entregar el resultado estructurado
- El HTML debe ser completo y autocontenido (estilos en <style>, lógica en <script> vanilla)
- Simula UI móvil moderna: tipografía limpia, cards, botones grandes, navegación inferior
- Implementa TODAS las pantallas dentro del mismo HTML con display:none/block para navegar
- Datos de ejemplo realistas, emojis como íconos
- El HTML debe funcionar standalone en un iframe sin dependencias externas

Cuando solo converses (sin generar código), responde normalmente con texto.
Si el usuario describe su app, confirma los requerimientos antes de generar.
Si el usuario aprueba o dice "genera"/"adelante"/"sí", llama a la tool y genera.`

const CREAR_APP_TOOL: FunctionDeclaration = {
  name: 'crear_app',
  description: 'Entrega el HTML generado de la app móvil junto con metadatos de pantallas y requerimientos',
  parameters: {
    type: 'object' as any,
    properties: {
      mensaje: {
        type: 'string' as any,
        description: 'Respuesta conversacional al usuario explicando qué se generó',
      },
      codigo: {
        type: 'string' as any,
        description: 'HTML completo y autocontenido de la app móvil simulada',
      },
      pantallas: {
        type: 'array' as any,
        description: 'Lista de pantallas generadas',
        items: {
          type: 'object' as any,
          properties: {
            nombre: { type: 'string' as any, description: 'Nombre de la pantalla' },
            descripcion: { type: 'string' as any, description: 'Descripción funcional de qué hace y muestra esta pantalla' },
          },
          required: ['nombre', 'descripcion'],
        },
      },
      requerimientos: {
        type: 'array' as any,
        description: 'Lista de requerimientos detectados del prompt del usuario',
        items: { type: 'string' as any },
      },
    },
    required: ['mensaje', 'codigo', 'pantallas'],
  },
}

const TOOLS: Tool[] = [{ functionDeclarations: [CREAR_APP_TOOL] }]

const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
]

const MAX_AUTO_RETRY_DELAY_MS = 30_000

const QUOTA_EXHAUSTED_RESPONSE: IAResponse = {
  mensaje: '⏳ La cuota de la API de IA está temporalmente agotada. Se reinicia a la 1:00 AM (hora de Querétaro). Si persiste, activa billing en aistudio.google.com.',
  codigo: null,
  pantallas: null,
  requerimientos: null,
}

export interface PantallaIA {
  nombre: string
  descripcion: string
}

export interface IAResponse {
  mensaje: string
  codigo: string | null
  pantallas: PantallaIA[] | null
  requerimientos: string[] | null
}

export interface MensajeChat {
  role: 'user' | 'model'
  contenido: string
}

function extractRetryDelayMs(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err)
  const match = msg.match(/retry(?:Delay)?['":\s]+(\d+(?:\.\d+)?)s/i)
  if (match) return Math.ceil(parseFloat(match[1]) * 1000)
  return null
}

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')
}

function isModelNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('404') || msg.includes('not found') || msg.includes('not supported')
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

export class IAService {
  private buildHistory(mensajes: Mensaje[]) {
    return mensajes.map((m) => ({
      role: m.emisor === 'usuario' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.contenido }],
    }))
  }

  private async withFallback<T>(fn: (modelName: string) => Promise<T>, exhaustedFallback: T): Promise<T> {
    for (const modelName of MODEL_FALLBACK_CHAIN) {
      try {
        return await fn(modelName)
      } catch (err) {
        if (isQuotaError(err)) {
          const retryMs = extractRetryDelayMs(err)
          if (retryMs !== null && retryMs <= MAX_AUTO_RETRY_DELAY_MS) {
            console.warn(`[IAService] Cuota en ${modelName}. Reintentando en ${retryMs}ms...`)
            await sleep(retryMs)
            try { return await fn(modelName) } catch {
              console.warn(`[IAService] Reintento fallido en ${modelName}. Siguiente modelo...`)
            }
          } else {
            console.warn(`[IAService] Cuota en ${modelName} (delay largo). Siguiente modelo...`)
          }
        } else if (isModelNotFoundError(err)) {
          console.warn(`[IAService] ${modelName} no disponible (404). Siguiente modelo...`)
        } else {
          throw err
        }
      }
    }
    console.error('[IAService] Todos los modelos fallaron por cuota.')
    return exhaustedFallback
  }

  async chat(prompt: string, historial: Mensaje[]): Promise<IAResponse> {
    const history = this.buildHistory(historial)

    return this.withFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        tools: TOOLS,
      })

      const chat = model.startChat({ history })
      const result = await chat.sendMessage(prompt)
      const response = result.response

      // Verifica si la IA llamó la tool
      const candidate = response.candidates?.[0]
      const parts = candidate?.content?.parts ?? []

      for (const part of parts) {
        if (part.functionCall && part.functionCall.name === 'crear_app') {
          const args = part.functionCall.args as any
          return {
            mensaje: args.mensaje ?? '¡App generada!',
            codigo: args.codigo ?? null,
            pantallas: args.pantallas ?? null,
            requerimientos: args.requerimientos ?? null,
          }
        }
      }

      // Sin tool call — respuesta conversacional pura
      const texto = response.text()
      return { mensaje: texto, codigo: null, pantallas: null, requerimientos: null }
    }, QUOTA_EXHAUSTED_RESPONSE)
  }

  async generarAppDesdePrompt(prompt: string): Promise<IAResponse> {
    return this.withFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        tools: TOOLS,
      })

      const result = await model.generateContent(prompt)
      const response = result.response
      const parts = response.candidates?.[0]?.content?.parts ?? []

      for (const part of parts) {
        if (part.functionCall && part.functionCall.name === 'crear_app') {
          const args = part.functionCall.args as any
          return {
            mensaje: args.mensaje ?? '¡App generada!',
            codigo: args.codigo ?? null,
            pantallas: args.pantallas ?? null,
            requerimientos: args.requerimientos ?? null,
          }
        }
      }

      return { mensaje: response.text(), codigo: null, pantallas: null, requerimientos: null }
    }, QUOTA_EXHAUSTED_RESPONSE)
  }
}
