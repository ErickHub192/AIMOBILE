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
    const esHTML = codigo.trimStart().startsWith('<!DOCTYPE') || codigo.trimStart().startsWith('<html')

    return esHTML
      ? this.generarZipHTML(codigo, appName)
      : this.generarZipExpo(codigo, appName)
  }

  private async generarZipHTML(codigo: string, appName: string): Promise<Buffer> {
    const zip = new JSZip()
    const folder = zip.folder(appName)!

    folder.file('index.html', codigo)
    folder.file('README.md', `# ${appName}

App móvil generada por snitch.

## Cómo abrir

Abre el archivo \`index.html\` directamente en tu navegador.
No requiere servidor ni dependencias.
`)

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    return buffer
  }

  private async generarZipExpo(codigo: string, appName: string): Promise<Buffer> {
    const zip = new JSZip()
    const folder = zip.folder(appName)!

    folder.file('App.js', codigo)

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

    folder.file('babel.config.js', `module.exports = function(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
`)

    folder.file('.gitignore', `node_modules/\n.expo/\ndist/\nweb-build/\n`)

    folder.file('README.md', `# ${appName}

Proyecto React Native (Expo) generado por snitch.

## Pasos para correr

\`\`\`bash
npm install
npm start
\`\`\`

Escanea el QR con Expo Go en tu teléfono.
`)

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    return buffer
  }

  // Stub para listar exports (sin DB de APKs por ahora)
  async listarExports(_proyecto_id: string) {
    return []
  }
}
