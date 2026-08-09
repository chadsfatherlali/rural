# Configuración PrimeUI + Tailwind CSS v4

## Overview

El proyecto utiliza **PrimeNG** como componentes base y **Tailwind CSS v4** como framework de utilidades. La integración se realiza mediante `tailwindcss-primeui` en PostCSS.

---

## Archivos de Configuración

### 1. `tailwind.config.ts`

Archivo de configuración principal de Tailwind (sin plugin de PrimeUI, solo configuración):

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{html,ts,tsx}',
    './src/index.html'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#500724'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      }
    }
  }
};

export default config;
```

### 2. `.postcssrc.json`

PostCSS procesa los imports de Tailwind y PrimeUI automáticamente:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {},
    "tailwindcss-primeui": {}
  }
}
```

### 3. `src/styles.css`

Estilos globales que importan Tailwind v4 y PrimeUI:

```css
/* Tailwind CSS v4 */
@import "tailwindcss";
@import "tailwindcss-primeui";

/* PrimeNG Theme - Elige uno según tu preferencia */
@import "@primeuix/themes/aura-light";

/* Global Styles */
:root {
  --primary-color: #ef4444;
  --primary-foreground: #ffffff;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}
```

---

## Temas Disponibles en PrimeUI

Reemplaza `@primeuix/themes/aura-light` en `src/styles.css` por alguno de estos:

### Light Themes
- `@primeuix/themes/aura-light` (actual)
- `@primeuix/themes/lara-light-blue`
- `@primeuix/themes/lara-light-indigo`
- `@primeuix/themes/lara-light-purple`
- `@primeuix/themes/lara-light-teal`
- `@primeuix/themes/lara-light-cyan`
- `@primeuix/themes/lara-light-green`
- `@primeuix/themes/lara-light-emerald`
- `@primeuix/themes/lara-light-amber`

### Dark Themes
- `@primeuix/themes/aura-dark`
- `@primeuix/themes/lara-dark-blue`
- `@primeuix/themes/lara-dark-indigo`
- `@primeuix/themes/lara-dark-purple`

---

## Cómo Usar PrimeUI en Componentes

### Importar Componentes de PrimeUI

```typescript
import { Component } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [ButtonDirective, CardModule, InputTextModule],
  template: `
    <div class="p-card w-full max-w-md">
      <div class="text-lg font-semibold mb-4">Mi Card</div>
      
      <input type="text" pInputText placeholder="Ingresa algo..." class="w-full mb-4" />
      <button pButton label="Enviar" [raised]="true" class="w-full"></button>
    </div>
  `
})
export class ExampleComponent {}
```

### Combinar PrimeUI + Tailwind

```html
<!-- PrimeUI component con clases Tailwind -->
<div class="w-full shadow-lg border border-gray-200 rounded-lg p-4">
  <div class="flex flex-col gap-4">
    <input 
      type="text"
      pInputText 
      placeholder="Nombre" 
      class="w-full"
    />
    
    <button 
      pButton 
      label="Guardar"
      [raised]="true"
      class="w-full"
    ></button>
  </div>
</div>
```

---

## Utilidades Tailwind Comunes

```html
<!-- Espaciado -->
<div class="p-4 m-2 gap-3"></div>

<!-- Display y Layout -->
<div class="flex justify-center items-center w-full h-screen"></div>

<!-- Texto -->
<p class="text-lg font-semibold text-gray-700"></p>

<!-- Colores PrimeUI -->
<div class="bg-primary-500 text-white"></div>
<div class="bg-surface-100 text-text-color"></div>

<!-- Responsive -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"></div>

<!-- Bordes y Sombras -->
<div class="border border-gray-200 rounded-lg shadow-md"></div>
```

---

## Colores PrimeUI Disponibles

El plugin `tailwindcss-primeui` proporciona estas utilidades de color:

| Clase | Descripción |
|-------|-----------|
| `bg-primary-[50-950]` | Paleta de colores primarios |
| `bg-surface-[0-950]` | Colores de superficie |
| `text-color` | Color de texto principal |
| `text-color-emphasis` | Énfasis en texto |
| `text-muted-color` | Texto secundario |
| `bg-emphasis` | Fondo con énfasis |
| `bg-highlight` | Fondo destacado |
| `border-surface` | Bordes de superficie |
| `rounded-border` | Radio de borde |

---

## Componentes PrimeUI Recomendados

| Componente | Módulo | Import |
|-----------|--------|--------|
| Button | ButtonDirective | `primeng/button` |
| Card | CardModule | `primeng/card` |
| InputText | InputTextModule | `primeng/inputtext` |
| Dropdown | DropdownModule | `primeng/dropdown` |
| DataTable | TableModule | `primeng/table` |
| Dialog | DialogModule | `primeng/dialog` |
| Toast | ToastModule | `primeng/toast` |
| Sidebar | SidebarModule | `primeng/sidebar` |
| InputNumber | InputNumberModule | `primeng/inputnumber` |
| Calendar | CalendarModule | `primeng/calendar` |

---

## Instalación de Dependencias

Si aún no lo has hecho, instala todas las dependencias:

```bash
npm install
```

Luego, inicia el servidor de desarrollo:

```bash
npm start
```

---

## Dark Mode

Para habilitar dark mode, actualiza `src/styles.css`:

```css
/* Para system preference (recomendado) */
@import "@primeuix/themes/aura-dark";

/* O para selector personalizado */
@import "@primeuix/themes/aura-dark";
```

En tu aplicación, toggle dark mode:

```typescript
// app.component.ts
export class AppComponent {
  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  }
}
```

---

## Troubleshooting

### Los estilos no se aplican
1. Asegúrate de que `src/styles.css` esté importado en `angular.json`
2. Reinicia el servidor de desarrollo: `npm start`
3. Limpia el caché: `rm -rf .angular` y `npm start` nuevamente

### Conflictos de clases de Tailwind
Si hay conflictos con otros frameworks CSS:
- Usa prefijos en `tailwind.config.ts`: `prefix: 'tw-'`
- Aplica las clases como `tw-flex`, `tw-gap-4`, etc.

### Los componentes de PrimeUI se ven sin estilo
- Verifica que hayas importado el tema en `src/styles.css`
- Asegúrate de que `tailwindcss-primeui` esté en `package.json`
- Reinicia el servidor de desarrollo

---

## Referencias

- [PrimeNG Official Docs](https://primeng.org/)
- [PrimeNG + Tailwind Integration](https://primeng.org/tailwind)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/)
- [PrimeUI Themes](https://primeuix.org/)
