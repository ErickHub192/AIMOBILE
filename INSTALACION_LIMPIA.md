# Instalación limpia de Snitch

Esta entrega no incluye `package-lock.json` para evitar que npm use rutas internas del entorno donde se generó el ZIP.

Ejecuta desde la raíz del proyecto:

```powershell
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run dev
```

Si ya habías intentado instalar una versión anterior y falló:

```powershell
taskkill /F /IM node.exe
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm.cmd cache clean --force
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run dev
```

El archivo `.env.local` debe estar junto a `package.json`.
