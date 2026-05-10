import { GoogleGenerativeAI } from '@google/generative-ai'
import { Mensaje } from '@/lib/types/database.types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

const SYSTEM_PROMPT = `Eres el backend generador de apps móviles de Snitch.

Responde SIEMPRE en JSON válido con esta estructura exacta:
{
  "mensaje": "respuesta corta en español",
  "codigo": "código completo de App.tsx para Expo React Native",
  "pantallas": ["pantalla 1", "pantalla 2"],
  "requerimientos": ["requerimiento 1", "requerimiento 2"]
}

Reglas obligatorias:
- No pidas confirmación para generar; genera una primera versión útil de inmediato.
- El código debe ser un App.tsx completo y ejecutable en Expo.
- Usa solamente react, react-native y componentes básicos.
- Las pantallas deben cambiar según el dominio solicitado por el usuario.
- Si el usuario pide cambios, devuelve una nueva versión completa.`

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

type GeneratedSpec = {
  category: string
  appName: string
  subtitle: string
  screens: string[]
  primary: string
  secondary: string
  accent: string
  cards: { title: string; subtitle: string; meta: string }[]
  actions: string[]
  requirements: string[]
}

function titleCase(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function cleanPrompt(prompt: string) {
  return prompt.replace(/`/g, '').replace(/\$/g, '').trim()
}

function appNameFromPrompt(prompt: string, fallback: string) {
  const cleaned = cleanPrompt(prompt).toLowerCase()
  if (cleaned.includes('youtube') || cleaned.includes('video') || cleaned.includes('short')) return 'StreamTube'
  if (cleaned.includes('steam') || cleaned.includes('juego') || cleaned.includes('parche') || cleaned.includes('lanzamiento')) return 'GamePulse'
  if (cleaned.includes('rol') || cleaned.includes('dungeon') || cleaned.includes('dragon') || cleaned.includes('personaje')) return 'RolForge'
  if (cleaned.includes('receta') || cleaned.includes('cocina') || cleaned.includes('ingrediente')) return 'Recetario Vivo'
  if (cleaned.includes('proyecto escolar') || cleaned.includes('actividades') || cleaned.includes('elementos faltantes')) return 'Avance Escolar'
  if (cleaned.includes('veterinaria') || cleaned.includes('mascota') || cleaned.includes('vacuna')) return 'VetCare'
  if (cleaned.includes('cafeter') || cleaned.includes('bebida') || cleaned.includes('menu')) return 'Café Nexo'
  if (cleaned.includes('tienda') || cleaned.includes('catalogo') || cleaned.includes('carrito')) return 'MarketFlow'
  if (cleaned.includes('mapa') || cleaned.includes('ruta') || cleaned.includes('ubicacion')) return 'Ruta Viva'
  return titleCase(fallback || 'App Móvil') || 'App Móvil'
}

function analyzePrompt(prompt: string): GeneratedSpec {
  const lower = prompt.toLowerCase()
  const name = appNameFromPrompt(prompt, prompt)

  if (lower.includes('youtube') || lower.includes('short') || lower.includes('video')) {
    return {
      category: 'video',
      appName: name,
      subtitle: 'Feed de videos, shorts y reproducción móvil.',
      screens: ['Feed', 'Shorts', 'Reproductor', 'Canales', 'Perfil'],
      primary: '#ff315b',
      secondary: '#111827',
      accent: '#38bdf8',
      cards: [
        { title: 'Video recomendado', subtitle: 'Miniatura grande con duración, canal y vistas.', meta: '12:48' },
        { title: 'Short vertical', subtitle: 'Contenido rápido con acciones sociales.', meta: 'LIVE' },
        { title: 'Canal destacado', subtitle: 'Avatar, últimos videos y botón de suscripción.', meta: '24k' },
      ],
      actions: ['Reproducir', 'Like', 'Compartir', 'Guardar'],
      requirements: [
        'Mostrar un feed principal de videos recomendados.',
        'Permitir una pantalla de shorts verticales.',
        'Incluir una pantalla de reproductor con controles básicos.',
        'Agregar canales, suscripciones y perfil del usuario.',
      ],
    }
  }

  if (lower.includes('steam') || lower.includes('lanzamiento') || lower.includes('parche') || lower.includes('juego')) {
    return {
      category: lower.includes('calendario') || lower.includes('lanzamiento') || lower.includes('parche') ? 'calendario_juegos' : 'tienda_juegos',
      appName: name,
      subtitle: lower.includes('calendario') || lower.includes('lanzamiento') || lower.includes('parche')
        ? 'Calendario de estrenos, parches y seguimiento de juegos.'
        : 'Tienda y biblioteca de videojuegos con ofertas.',
      screens: lower.includes('calendario') || lower.includes('lanzamiento') || lower.includes('parche')
        ? ['Calendario', 'Próximos estrenos', 'Detalle del juego', 'Parches', 'Favoritos']
        : ['Tienda', 'Biblioteca', 'Juego', 'Ofertas', 'Perfil gamer'],
      primary: '#22d3ee',
      secondary: '#0f172a',
      accent: '#a78bfa',
      cards: lower.includes('calendario') || lower.includes('lanzamiento') || lower.includes('parche')
        ? [
            { title: 'Estreno próximo', subtitle: 'Fecha, plataforma y género del juego.', meta: '15 JUN' },
            { title: 'Parche importante', subtitle: 'Notas de actualización y bugs corregidos.', meta: 'v2.4' },
            { title: 'Recordatorio', subtitle: 'Alerta antes de la salida o actualización.', meta: 'ACTIVO' },
          ]
        : [
            { title: 'Oferta destacada', subtitle: 'Ficha con portada, precio y valoración.', meta: '-40%' },
            { title: 'Biblioteca activa', subtitle: 'Juegos instalados y progreso.', meta: '18' },
            { title: 'Logros', subtitle: 'Resumen de logros desbloqueados.', meta: '72%' },
          ],
      actions: lower.includes('calendario') || lower.includes('lanzamiento') || lower.includes('parche')
        ? ['Agregar alerta', 'Ver parche', 'Guardar juego']
        : ['Instalar', 'Comprar', 'Añadir a wishlist'],
      requirements: lower.includes('calendario') || lower.includes('lanzamiento') || lower.includes('parche')
        ? [
            'Registrar lanzamientos de juegos por fecha.',
            'Mostrar parches y bugs arreglados por título.',
            'Permitir favoritos y recordatorios.',
            'Incluir detalle de cada juego con plataforma y estado.',
          ]
        : [
            'Mostrar tienda de videojuegos con ofertas.',
            'Incluir biblioteca del usuario.',
            'Agregar detalle de juego, logros y perfil gamer.',
          ],
    }
  }

  if (lower.includes('rol') || lower.includes('dungeon') || lower.includes('dragon') || lower.includes('personaje')) {
    return {
      category: 'rol',
      appName: name,
      subtitle: 'Creación y gestión de personajes para juego de rol.',
      screens: ['Inicio', 'Crear personaje', 'Razas y clases', 'Hoja de personaje', 'Inventario', 'Campaña'],
      primary: '#f97316',
      secondary: '#1c1917',
      accent: '#facc15',
      cards: [
        { title: 'Nuevo héroe', subtitle: 'Nombre, raza, clase y trasfondo.', meta: 'Nv. 1' },
        { title: 'Atributos', subtitle: 'Fuerza, destreza, inteligencia y carisma.', meta: '+2' },
        { title: 'Inventario', subtitle: 'Armas, armadura, oro y objetos mágicos.', meta: '12 items' },
      ],
      actions: ['Crear personaje', 'Guardar hoja', 'Ver campaña'],
      requirements: [
        'Permitir crear personajes de rol con nombre, raza y clase.',
        'Registrar atributos, inventario y progreso del personaje.',
        'Mostrar una hoja de personaje consultable.',
        'Agregar seguimiento de campañas o misiones.',
      ],
    }
  }

  if (lower.includes('receta') || lower.includes('cocina') || lower.includes('ingrediente')) {
    return {
      category: 'recetas',
      appName: name,
      subtitle: 'Recetas organizadas por ingredientes, pasos y favoritos.',
      screens: ['Inicio', 'Recetas', 'Detalle de receta', 'Ingredientes', 'Favoritos'],
      primary: '#34d399',
      secondary: '#052e2b',
      accent: '#fbbf24',
      cards: [
        { title: 'Receta destacada', subtitle: 'Preparación paso a paso con tiempo estimado.', meta: '25 min' },
        { title: 'Ingredientes', subtitle: 'Lista agrupada con cantidades.', meta: '8' },
        { title: 'Favoritos', subtitle: 'Recetas guardadas para repetir.', meta: '3' },
      ],
      actions: ['Ver receta', 'Guardar', 'Agregar ingredientes'],
      requirements: [
        'Registrar recetas con ingredientes y pasos.',
        'Mostrar detalle de preparación y tiempo estimado.',
        'Permitir marcar recetas como favoritas.',
      ],
    }
  }

  if (lower.includes('proyecto escolar') || lower.includes('actividades') || lower.includes('elementos faltantes') || lower.includes('cumplidos')) {
    return {
      category: 'seguimiento_escolar',
      appName: name,
      subtitle: 'Registro de actualizaciones, elementos faltantes y puntos cumplidos.',
      screens: ['Panel', 'Actividades', 'Elementos faltantes', 'Avance', 'Reporte'],
      primary: '#60a5fa',
      secondary: '#0f172a',
      accent: '#22c55e',
      cards: [
        { title: 'Actividad pendiente', subtitle: 'Tarea registrada con estado y responsable.', meta: 'ALTA' },
        { title: 'Elemento faltante', subtitle: 'Bloqueo o recurso necesario para continuar.', meta: '2' },
        { title: 'Puntos cumplidos', subtitle: 'Resumen de avances del proyecto.', meta: '76%' },
      ],
      actions: ['Registrar avance', 'Agregar faltante', 'Generar reporte'],
      requirements: [
        'Registrar actividades y actualizaciones del proyecto escolar.',
        'Identificar elementos faltantes y estado de cumplimiento.',
        'Mostrar avance general y reportes.',
      ],
    }
  }

  if (lower.includes('veterinaria') || lower.includes('mascota') || lower.includes('vacuna')) {
    return {
      category: 'veterinaria',
      appName: name,
      subtitle: 'Citas, expedientes, vacunas y recordatorios para mascotas.',
      screens: ['Agenda', 'Pacientes', 'Expediente', 'Vacunas', 'Recordatorios'],
      primary: '#2dd4bf',
      secondary: '#042f2e',
      accent: '#a78bfa',
      cards: [
        { title: 'Cita próxima', subtitle: 'Consulta, fecha y médico asignado.', meta: '10:30' },
        { title: 'Paciente', subtitle: 'Ficha de mascota con historial clínico.', meta: 'Canino' },
        { title: 'Vacuna pendiente', subtitle: 'Recordatorio con fecha límite.', meta: '7 días' },
      ],
      actions: ['Agendar cita', 'Ver expediente', 'Recordar vacuna'],
      requirements: [
        'Gestionar citas veterinarias.',
        'Guardar expediente de pacientes.',
        'Registrar vacunas y recordatorios.',
      ],
    }
  }

  if (lower.includes('cafeter') || lower.includes('bebida') || lower.includes('menu')) {
    return {
      category: 'cafeteria',
      appName: name,
      subtitle: 'Menú, catálogo, detalle de bebida y carrito.',
      screens: ['Menú', 'Bebidas', 'Detalle', 'Carrito', 'Perfil'],
      primary: '#c084fc',
      secondary: '#1e1b4b',
      accent: '#67e8f9',
      cards: [
        { title: 'Latte especial', subtitle: 'Bebida destacada con precio y tamaño.', meta: '$65' },
        { title: 'Cold brew', subtitle: 'Categoría de bebidas frías.', meta: '$58' },
        { title: 'Carrito', subtitle: 'Resumen de pedido antes de pagar.', meta: '2 items' },
      ],
      actions: ['Agregar', 'Ver menú', 'Pagar'],
      requirements: [
        'Mostrar catálogo de bebidas y alimentos.',
        'Agregar detalle de producto con precio.',
        'Incluir carrito de compras.',
      ],
    }
  }

  return {
    category: 'general',
    appName: name,
    subtitle: 'Aplicación móvil generada desde el backend según el prompt.',
    screens: ['Inicio', 'Registro', 'Explorar', 'Detalle', 'Perfil'],
    primary: '#22d3ee',
    secondary: '#0f172a',
    accent: '#a78bfa',
    cards: [
      { title: 'Módulo principal', subtitle: cleanPrompt(prompt), meta: 'MVP' },
      { title: 'Flujo secundario', subtitle: 'Pantalla generada para completar el recorrido.', meta: 'v1' },
      { title: 'Configuración', subtitle: 'Preferencias y perfil del usuario.', meta: 'SET' },
    ],
    actions: ['Comenzar', 'Guardar', 'Continuar'],
    requirements: [
      `Implementar el flujo principal solicitado: ${cleanPrompt(prompt)}`,
      'Registrar información del usuario y del proyecto.',
      'Mostrar pantallas móviles navegables.',
    ],
  }
}

function jsString(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function buildReactNativeCode(spec: GeneratedSpec, prompt: string) {
  const promptSafe = cleanPrompt(prompt)
  return `import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const APP_NAME = ${JSON.stringify(spec.appName)};
const SUBTITLE = ${JSON.stringify(spec.subtitle)};
const CATEGORY = ${JSON.stringify(spec.category)};
const ORIGINAL_PROMPT = ${JSON.stringify(promptSafe)};
const COLORS = ${jsString({ primary: spec.primary, secondary: spec.secondary, accent: spec.accent })};
const SCREENS = ${jsString(spec.screens)};
const CARDS = ${jsString(spec.cards)};
const ACTIONS = ${jsString(spec.actions)};

function Badge({ children }: { children: React.ReactNode }) {
  return <Text style={styles.badge}>{children}</Text>;
}

function Card({ title, subtitle, meta }: { title: string; subtitle: string; meta: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardMedia}><View style={styles.glow} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
        <Text style={styles.cardMeta}>{meta}</Text>
      </View>
    </View>
  );
}

function Hero({ current }: { current: string }) {
  return (
    <View style={styles.hero}>
      <Badge>{CATEGORY}</Badge>
      <Text style={styles.heroTitle}>{current}</Text>
      <Text style={styles.heroText}>{SUBTITLE}</Text>
      <Text style={styles.prompt}>Prompt base: {ORIGINAL_PROMPT}</Text>
    </View>
  );
}

export default function App() {
  const [current, setCurrent] = useState(SCREENS[0]);
  const activeCards = useMemo(() => CARDS.map((item, index) => ({ ...item, title: current === SCREENS[0] ? item.title : current + ' · ' + (index + 1) })), [current]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.small}>Generada por Snitch Backend</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>S</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Hero current={current} />

        <View style={styles.actionsRow}>
          {ACTIONS.map((action) => (
            <TouchableOpacity key={action} style={styles.actionButton}>
              <Text style={styles.actionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Contenido de {current}</Text>
        {activeCards.map((item) => <Card key={item.title} {...item} />)}
      </ScrollView>

      <View style={styles.tabs}>
        {SCREENS.slice(0, 5).map((screen) => (
          <TouchableOpacity key={screen} onPress={() => setCurrent(screen)} style={[styles.tab, current === screen && styles.tabActive]}>
            <Text style={[styles.tabText, current === screen && styles.tabTextActive]}>{screen}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.secondary },
  header: { padding: 20, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appName: { color: 'white', fontSize: 24, fontWeight: '900' },
  small: { color: '#94a3b8', marginTop: 4 },
  avatar: { width: 42, height: 42, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#020617', fontWeight: '900' },
  content: { padding: 18, paddingBottom: 110 },
  hero: { minHeight: 210, borderRadius: 32, padding: 22, justifyContent: 'flex-end', backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  badge: { alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: COLORS.primary, color: '#020617', fontWeight: '900', textTransform: 'uppercase' },
  heroTitle: { color: 'white', fontSize: 34, fontWeight: '900', marginTop: 18 },
  heroText: { color: '#cbd5e1', fontSize: 16, lineHeight: 22, marginTop: 8 },
  prompt: { color: '#94a3b8', marginTop: 14, fontSize: 12, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 20 },
  actionButton: { backgroundColor: COLORS.accent, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14 },
  actionText: { color: '#020617', fontWeight: '900' },
  sectionTitle: { color: 'white', fontWeight: '900', fontSize: 20, marginBottom: 12 },
  card: { flexDirection: 'row', gap: 14, borderRadius: 24, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardMedia: { width: 86, height: 70, borderRadius: 18, backgroundColor: COLORS.primary, opacity: 0.75, alignItems: 'center', justifyContent: 'center' },
  glow: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.35)' },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  cardSubtitle: { color: '#cbd5e1', marginTop: 5, lineHeight: 18 },
  cardMeta: { color: COLORS.accent, marginTop: 6, fontWeight: '900' },
  tabs: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#020617', padding: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  tabText: { color: '#94a3b8', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  tabTextActive: { color: COLORS.primary },
});
`
}

export class IAService {
  private buildHistory(mensajes: Mensaje[]): MensajeChat[] {
    return mensajes.map((m) => ({
      role: m.emisor === 'usuario' ? 'user' : 'model',
      contenido: m.contenido,
    }))
  }

  async chat(prompt: string, historial: Mensaje[]): Promise<IAResponse> {
    if (!process.env.GEMINI_API_KEY) return this.generarRespuestaLocal(prompt)

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
    })

    const history = this.buildHistory(historial).map((m) => ({
      role: m.role,
      parts: [{ text: m.contenido }],
    }))

    try {
      const chat = model.startChat({ history })
      const result = await chat.sendMessage(prompt)
      const text = result.response.text()
      const parsed = this.parseResponse(text)
      if (!parsed.codigo || !parsed.pantallas?.length) return this.generarRespuestaLocal(prompt)
      return parsed
    } catch (error) {
      console.warn('[Snitch IA] Gemini no respondió. Se usará generador local del backend.', error)
      return this.generarRespuestaLocal(prompt)
    }
  }

  async generarAppDesdePrompt(prompt: string): Promise<IAResponse> {
    return this.chat(prompt, [])
  }

  private generarRespuestaLocal(prompt: string): IAResponse {
    const spec = analyzePrompt(prompt)
    const codigo = buildReactNativeCode(spec, prompt)

    return {
      mensaje: `Generé una versión móvil de tipo ${spec.category}. Se crearon ${spec.screens.length} pantallas y un App.tsx de Expo descargable desde Exportar.`,
      codigo,
      pantallas: spec.screens,
      requerimientos: spec.requirements,
    }
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
