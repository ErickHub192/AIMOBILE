import { GoogleGenerativeAI } from '@google/generative-ai'
import { Mensaje } from '@/lib/types/database.types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MODEL = 'gemma-4-it'

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

export class IAService {
  private buildHistory(mensajes: Mensaje[]): MensajeChat[] {
    return mensajes.map((m) => ({
      role: m.emisor === 'usuario' ? 'user' : 'model',
      contenido: m.contenido,
    }))
  }

  async chat(prompt: string, historial: Mensaje[]): Promise<IAResponse> {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
    })

    const history = this.buildHistory(historial).map((m) => ({
      role: m.role,
      parts: [{ text: m.contenido }],
    }))

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(prompt)
    const text = result.response.text()

    return this.parseResponse(text)
  }

  async generarAppDesdePrompt(prompt: string): Promise<IAResponse> {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return this.parseResponse(text)
  }

  private parseResponse(text: string): IAResponse {
    try {
      const json = text.replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(json)
    } catch {
      return {
        mensaje: text,
        codigo: null,
        pantallas: null,
        requerimientos: null,
      }
    }
  }
}
