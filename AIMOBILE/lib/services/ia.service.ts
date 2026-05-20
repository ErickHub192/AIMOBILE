import { GoogleGenerativeAI } from '@google/generative-ai'
import { Mensaje } from '@/lib/types/database.types'

// Todos los modelos actuales (2026) usan v1beta — el SDK lo usa por default
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `Eres un arquitecto de apps móviles. Tu trabajo es generar código React Native completo y funcional basado en los requerimientos del usuario.

Reglas:
- Genera solo código React Native (Expo)
- Responde siempre en JSON con esta estructura: { "mensaje": string, "codigo": string | null, "pantallas": string[] | null, "requerimientos": string[] | null }
- "mensaje" es tu respuesta conversacional al usuario
- "codigo" es el código generado (null si solo es conversación)
- "pantallas" es lista de nombres de pantallas detectadas (null si no aplica)
- "requerimientos" es lista de requerimientos detectados del prompt (null si no aplica)
- Si el usuario da un prompt inicial, extrae requerimientos y confirma antes de generar
- Si el usuario aprueba, genera el código completo`

/**
 * Cadena de modelos Gemini activos en mayo 2026 (serie 2.5, todos en v1beta).
 * Ordenados de mayor a menor cuota free tier:
 *   Flash-Lite: 15 RPM, 1000 RPD
 *   Flash:      10 RPM,  250 RPD
 *   Pro:         5 RPM,  100 RPD
 *
 * Modelos retirados (ya no usar):
 *   gemini-1.0-x, gemini-1.5-x  → apagados, devuelven 404
 *   gemini-2.0-flash, 2.0-flash-lite → deprecados, se apagarán jun 1 2026
 */
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash-lite',  // mayor cuota, primer intento
  'gemini-2.5-flash',       // cuota media, buen balance
  'gemini-2.5-pro',         // menor cuota, mayor calidad, último recurso
]

const MAX_AUTO_RETRY_DELAY_MS = 30_000

const QUOTA_EXHAUSTED_RESPONSE: IAResponse = {
  mensaje: '⏳ La cuota de la API de IA está temporalmente agotada en todos los modelos disponibles. La cuota diaria del free tier se reinicia a la 1:00 AM (hora de Querétaro). Si el problema persiste más de un día, considera activar billing en aistudio.google.com.',
  codigo: null,
  pantallas: null,
  requerimientos: null,
}

export interface IAResponse {
  mensaje: string
  codigo: string | null
  pantallas: string[] | null
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
  private buildHistory(mensajes: Mensaje[]): MensajeChat[] {
    return mensajes.map((m) => ({
      role: m.emisor === 'usuario' ? 'user' : 'model',
      contenido: m.contenido,
    }))
  }

  private async withFallback<T>(
    fn: (modelName: string) => Promise<T>,
    exhaustedFallback: T
  ): Promise<T> {
    for (const modelName of MODEL_FALLBACK_CHAIN) {
      try {
        return await fn(modelName)
      } catch (err) {
        if (isQuotaError(err)) {
          const retryMs = extractRetryDelayMs(err)
          if (retryMs !== null && retryMs <= MAX_AUTO_RETRY_DELAY_MS) {
            console.warn(`[IAService] Cuota en ${modelName}. Reintentando en ${retryMs}ms...`)
            await sleep(retryMs)
            try {
              return await fn(modelName)
            } catch (retryErr) {
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
    const history = this.buildHistory(historial).map((m) => ({
      role: m.role,
      parts: [{ text: m.contenido }],
    }))

    return this.withFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_PROMPT })
      const chat = model.startChat({ history })
      const result = await chat.sendMessage(prompt)
      return this.parseResponse(result.response.text())
    }, QUOTA_EXHAUSTED_RESPONSE)
  }

  async generarAppDesdePrompt(prompt: string): Promise<IAResponse> {
    return this.withFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_PROMPT })
      const result = await model.generateContent(prompt)
      return this.parseResponse(result.response.text())
    }, QUOTA_EXHAUSTED_RESPONSE)
  }

  private parseResponse(text: string): IAResponse {
    // 1. Quitar code fences
    let clean = text.replace(/```json\n?|\n?```/g, '').trim()

    // 2. Intento directo
    try { return JSON.parse(clean) } catch { /* continúa */ }

    // 3. Extraer el primer objeto JSON del texto (el modelo puede añadir texto antes/después)
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch { /* continúa */ }
    }

    // 4. Si todo falla, devolver el texto como mensaje sin código
    return { mensaje: clean, codigo: null, pantallas: null, requerimientos: null }
  }
}
