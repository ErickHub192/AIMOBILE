import { SupabaseClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import { VersionesRepository, ApksRepository, PantallasRepository } from '@/lib/repositories'
import { Pantalla, VersionAplicacion } from '@/lib/types/database.types'

export type ExportTipo = 'assets' | 'publish'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'snitch-app'
}

function looksLikeAppTsx(code: string | null) {
  return !!code && code.includes('export default function App') && code.includes('react-native')
}

function fallbackAppTsx(version: VersionAplicacion, pantallas: Pantalla[]) {
  const screens = pantallas.map((p) => p.nombre_pantalla)
  return `import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREENS = ${JSON.stringify(screens.length ? screens : ['Inicio', 'Detalle', 'Perfil'], null, 2)};

export default function App() {
  const [screen, setScreen] = useState(SCREENS[0]);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Snitch App</Text>
        <Text style={styles.subtitle}>Versión ${version.numero_version}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{screen}</Text>
          <Text style={styles.heroText}>Pantalla generada por el backend.</Text>
        </View>
        {SCREENS.map((item) => (
          <TouchableOpacity key={item} onPress={() => setScreen(item)} style={styles.card}>
            <Text style={styles.cardTitle}>{item}</Text>
            <Text style={styles.cardText}>Abrir módulo {item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 22 },
  title: { color: 'white', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#94a3b8', marginTop: 4 },
  content: { padding: 18, paddingBottom: 60 },
  hero: { minHeight: 180, borderRadius: 28, backgroundColor: '#0f172a', padding: 22, justifyContent: 'flex-end' },
  heroTitle: { color: 'white', fontSize: 34, fontWeight: '900' },
  heroText: { color: '#cbd5e1', marginTop: 8 },
  card: { marginTop: 14, padding: 18, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.07)' },
  cardTitle: { color: '#22d3ee', fontSize: 18, fontWeight: '900' },
  cardText: { color: '#cbd5e1', marginTop: 6 },
});
`
}

function packageJson(name: string) {
  return JSON.stringify({
    name,
    version: '1.0.0',
    private: true,
    main: 'node_modules/expo/AppEntry.js',
    scripts: {
      start: 'expo start',
      android: 'expo run:android',
      web: 'expo start --web',
    },
    dependencies: {
      '@expo/metro-runtime': '~5.0.4',
      expo: '~52.0.0',
      react: '18.3.1',
      'react-native': '0.76.5',
      'react-native-web': '~0.19.13',
    },
    devDependencies: {},
  }, null, 2)
}

function appJson(appName: string) {
  return JSON.stringify({
    expo: {
      name: appName,
      slug: slugify(appName),
      version: '1.0.0',
      orientation: 'portrait',
      platforms: ['android', 'web'],
      android: {
        package: `com.snitch.${slugify(appName).replace(/-/g, '')}`.slice(0, 70),
      },
    },
  }, null, 2)
}

function readme(appName: string, tipo: string) {
  return `# ${appName}

Este proyecto Expo fue generado por el backend de Snitch.

## Qué contiene

- App.tsx con la app móvil generada.
- package.json con dependencias Expo/React Native.
- app.json con configuración Android básica.
- snitch-export.json con la versión, pantallas y metadatos.

## Cómo probarlo

1. Descomprime este ZIP.
2. Ejecuta:

\`\`\`bash
npm install
npx expo start
\`\`\`

3. Para Android local:

\`\`\`bash
npx expo run:android
\`\`\`

Tipo de exportación: ${tipo}
`}

export class ExportService {
  private versionesRepo: VersionesRepository
  private apksRepo: ApksRepository
  private pantallasRepo: PantallasRepository

  constructor(private db: SupabaseClient) {
    this.versionesRepo = new VersionesRepository(db)
    this.apksRepo = new ApksRepository(db)
    this.pantallasRepo = new PantallasRepository(db)
  }

  async exportar(version_id: string, tipo: ExportTipo) {
    const version = await this.versionesRepo.findById(version_id)
    if (!version) throw new Error('Versión no encontrada')
    if (version.estado_generacion !== 'validada') throw new Error('La versión debe estar validada antes de exportar')

    if (tipo === 'assets') {
      return this.exportarAssets(version_id)
    }
    return this.exportarPublish(version_id, version.numero_version)
  }

  private async exportarAssets(version_id: string) {
    const nombre_archivo = `snitch-${version_id}-datos-version.zip`

    const apk = await this.apksRepo.create({
      version_id,
      nombre_archivo,
      version_name: 'datos',
    })

    return { tipo: 'assets', apk }
  }

  private async exportarPublish(version_id: string, numero_version: string) {
    const nombre_archivo = `snitch-${version_id}-proyecto-expo.zip`

    const apk = await this.apksRepo.create({
      version_id,
      nombre_archivo,
      version_name: numero_version,
    })

    return { tipo: 'publish', apk }
  }

  async prepararDescarga(proyecto_id: string, apk_id: string) {
    const exports = await this.listarExports(proyecto_id)
    const item = exports.find((exportItem) => exportItem.id === apk_id)
    if (!item) throw new Error('Exportación no encontrada para este proyecto')

    const version = await this.versionesRepo.findById(item.version_id)
    if (!version) throw new Error('Versión asociada no encontrada')
    const pantallas = await this.pantallasRepo.findByVersion(version.id)

    await this.marcarDescargado(apk_id)

    if (item.version_name === 'datos') {
      return this.crearZipDatos(item.nombre_archivo, version, pantallas, item)
    }

    return this.crearZipExpo(item.nombre_archivo, version, pantallas, item)
  }

  private async crearZipDatos(fileName: string, version: VersionAplicacion, pantallas: Pantalla[], exportacion: unknown) {
    const zip = new JSZip()
    zip.file('README.txt', 'Datos exportados por el backend de Snitch. Este ZIP contiene la especificación de la versión, pantallas y código fuente generado.\n')
    zip.file('version.json', JSON.stringify(version, null, 2))
    zip.file('pantallas.json', JSON.stringify(pantallas, null, 2))
    zip.file('exportacion.json', JSON.stringify(exportacion, null, 2))
    zip.file('App.tsx', looksLikeAppTsx(version.ruta_codigo_fuente) ? version.ruta_codigo_fuente! : fallbackAppTsx(version, pantallas))

    return {
      fileName,
      mimeType: 'application/zip',
      body: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
    }
  }

  private async crearZipExpo(fileName: string, version: VersionAplicacion, pantallas: Pantalla[], exportacion: unknown) {
    const zip = new JSZip()
    const appName = `Snitch ${version.numero_version}`
    const safeName = slugify(appName)
    const appCode = looksLikeAppTsx(version.ruta_codigo_fuente) ? version.ruta_codigo_fuente! : fallbackAppTsx(version, pantallas)

    zip.file('README.md', readme(appName, 'Proyecto Expo descargable'))
    zip.file('App.tsx', appCode)
    zip.file('package.json', packageJson(safeName))
    zip.file('app.json', appJson(appName))
    zip.file('snitch-export.json', JSON.stringify({ version, pantallas, exportacion }, null, 2))

    return {
      fileName,
      mimeType: 'application/zip',
      body: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
    }
  }

  async listarExports(proyecto_id: string) {
    return this.apksRepo.findByProyecto(proyecto_id)
  }

  async marcarDescargado(apk_id: string) {
    return this.apksRepo.updateEstado(apk_id, 'descargado')
  }
}
