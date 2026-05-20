import JSZip from 'jszip'
import { SupabaseClient } from '@supabase/supabase-js'
import { VersionesRepository } from '@/lib/repositories'

export type ExportTipo = 'assets' | 'publish'

/**
 * Genera un proyecto Expo listo para instalar y correr.
 * Estructura del ZIP:
 *   snitch-app/
 *   ├── App.js          ← código generado por la IA
 *   ├── package.json    ← dependencias Expo mínimas
 *   ├── app.json        ← configuración de la app
 *   ├── babel.config.js
 *   └── README.md       ← instrucciones de uso
 */
export class ExportService {
  private versionesRepo: VersionesRepository

  constructor(private db: SupabaseClient) {
    this.versionesRepo = new VersionesRepository(db)
  }

  async exportar(version_id: string, tipo: ExportTipo): Promise<Buffer> {
    const version = await this.versionesRepo.findById(version_id)
    if (!version) throw new Error('Versión no encontrada')
    if (!version.ruta_codigo_fuente) throw new Error('Esta versión no tiene código generado aún')

    const codigo = version.ruta_codigo_fuente
    const appName = `snitch-app-${version.numero_version}`

    return this.generarZipExpo(codigo, appName)
  }

  private async generarZipExpo(codigo: string, appName: string): Promise<Buffer> {
    const zip = new JSZip()
    const folder = zip.folder(appName)!

    // ── App.js — el código generado por la IA ──────────────────────────
    folder.file('App.js', codigo)

    // ── package.json ───────────────────────────────────────────────────
    folder.file('package.json', JSON.stringify({
      name: appName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: '1.0.0',
      main: 'node_modules/expo/AppEntry.js',
      scripts: {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web',
      },
      dependencies: {
        expo: '~52.0.0',
        'expo-status-bar': '~2.0.0',
        react: '18.3.2',
        'react-native': '0.76.5',
      },
      devDependencies: {
        '@babel/core': '^7.24.0',
        'babel-preset-expo': '~12.0.0',
      },
      private: true,
    }, null, 2))

    // ── app.json ───────────────────────────────────────────────────────
    folder.file('app.json', JSON.stringify({
      expo: {
        name: appName,
        slug: appName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        version: '1.0.0',
        orientation: 'portrait',
        platforms: ['ios', 'android', 'web'],
        sdkVersion: '52.0.0',
      },
    }, null, 2))

    // ── babel.config.js ────────────────────────────────────────────────
    folder.file('babel.config.js', `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
`)

    // ── .gitignore ─────────────────────────────────────────────────────
    folder.file('.gitignore', `node_modules/
.expo/
dist/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
`)

    // ── README.md — instrucciones de uso ───────────────────────────────
    folder.file('README.md', `# ${appName}

Proyecto React Native (Expo) generado por snitch.

## Requisitos

- Node.js 18 o superior
- npm o yarn
- Expo Go instalado en tu dispositivo (iOS / Android)

## Pasos para correr

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo
npm start
\`\`\`

Escanea el QR con la app Expo Go en tu teléfono.

## Comandos disponibles

| Comando           | Acción                  |
|-------------------|-------------------------|
| \`npm start\`     | Inicia Expo             |
| \`npm run android\` | Abre en Android       |
| \`npm run ios\`   | Abre en iOS (Mac only)  |
| \`npm run web\`   | Abre en navegador       |
`)

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    return buffer
  }

  // Stub para listar exports (sin DB de APKs por ahora)
  async listarExports(_proyecto_id: string) {
    return []
  }
}
