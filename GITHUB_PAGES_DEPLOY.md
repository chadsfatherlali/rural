# Guía de Publicación en GitHub Pages

## Requisitos Previos

- Tener Git instalado y configurado
- Tener MSYS2 instalado (para usar variables de entorno en Windows)
- Repositorio GitHub creado y configurado como `origin`
- Angular CLI instalado globalmente o localmente

## Instalación de Dependencias Necesarias

### 1. Instalar angular-cli-ghpages

Si aún no lo tienes instalado:

```bash
npm install -g @angular-schule/angular-cli-ghpages
```

O instalarlo localmente:

```bash
npm install --save-dev @angular-schule/angular-cli-ghpages
```

## Pasos para Publicar

### Paso 1: Compilar la aplicación con base-href

Ejecuta el siguiente comando en MSYS2 o PowerShell:

```bash
MSYS_NO_PATHCONV=1 ng build --base-href=/rural/
```

**Qué hace:**
- `MSYS_NO_PATHCONV=1`: Evita que MSYS convierta rutas de Unix a Windows
- `ng build`: Compila la aplicación en modo producción
- `--base-href=/rural/`: Establece la ruta base a `/rural/` (nombre del repositorio)

**Salida esperada:**
```
✔ Compilation successful.
✔ Build at: dist/rural/browser
```

### Paso 2: Publicar en GitHub Pages

Una vez compilado, ejecuta:

```bash
npx angular-cli-ghpages --dir=dist/rural/browser
```

**Qué hace:**
- `npx`: Ejecuta el paquete sin instalación global
- `angular-cli-ghpages`: Herramienta para publicar en GitHub Pages
- `--dir=dist/rural/browser`: Especifica el directorio compilado a publicar

**Salida esperada:**
```
✔ Deployment successful!
✔ Your app is available at: https://[usuario].github.io/rural/
```

## Comando Completo (Una Línea)

Para hacerlo todo en un solo comando:

```bash
MSYS_NO_PATHCONV=1 ng build --base-href=/rural/ && npx angular-cli-ghpages --dir=dist/rural/browser
```

## Verificación del Despliegue

1. Ve a tu repositorio en GitHub
2. Accede a **Settings → Pages**
3. Deberías ver:
   - **Source:** Deploy from a branch
   - **Branch:** gh-pages
   - **URL:** `https://[usuario].github.io/rural/`

4. Visita la URL en tu navegador para verificar que la aplicación está en línea

## Solución de Problemas

### Error: "MSYS_NO_PATHCONV no reconocido"

Si estás en **PowerShell** en lugar de MSYS2:

```powershell
$env:MSYS_NO_PATHCONV=1; ng build --base-href=/rural/
npx angular-cli-ghpages --dir=dist/rural/browser
```

### Error: "dist/rural/browser no encontrado"

Asegúrate de que:
1. El build se completó sin errores
2. La estructura de directorios es correcta:
   ```
   dist/
   └── rural/
       └── browser/
           ├── index.html
           ├── main.js
           └── ...
   ```

### La aplicación carga pero las rutas no funcionan

Asegúrate de que el `base-href` coincida con el nombre del repositorio:
```bash
MSYS_NO_PATHCONV=1 ng build --base-href=/[nombre-repo]/
```

### Cambios no se reflejan en GitHub Pages

1. Limpia el caché del navegador
2. Espera 2-5 minutos para que GitHub Pages actualice
3. Intenta en una ventana de incógnito

## Actualizar el Despliegue

Cada vez que hagas cambios y quieras actualizar:

```bash
MSYS_NO_PATHCONV=1 ng build --base-href=/rural/
npx angular-cli-ghpages --dir=dist/rural/browser
```

Esto sobrescribirá la rama `gh-pages` con la nueva compilación.

## Automatización (Opcional)

### Crear un script en package.json

Añade esto a tu `package.json`:

```json
{
  "scripts": {
    "deploy": "MSYS_NO_PATHCONV=1 ng build --base-href=/rural/ && npx angular-cli-ghpages --dir=dist/rural/browser"
  }
}
```

Luego solo ejecuta:

```bash
npm run deploy
```

### Para PowerShell

Crea un archivo `deploy.ps1`:

```powershell
$env:MSYS_NO_PATHCONV=1
ng build --base-href=/rural/
npx angular-cli-ghpages --dir=dist/rural/browser
```

Ejecuta:

```powershell
.\deploy.ps1
```

## URLs Importantes

- **Repositorio:** https://github.com/[usuario]/rural
- **GitHub Pages:** https://[usuario].github.io/rural/
- **Settings de Pages:** https://github.com/[usuario]/rural/settings/pages

## Referencias

- [Angular CLI Documentation](https://angular.io/guide/deployment)
- [angular-cli-ghpages](https://github.com/angular-schule/angular-cli-ghpages)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
