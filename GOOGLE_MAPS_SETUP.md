# Google Maps Integration Setup

## Overview

Se ha integrado Google Maps en la página inicial (HomePageComponent) para mostrar un mapa interactivo de Ecuador con los establecimientos sanitarios.

## Archivos Modificados

### 1. `src/index.html`
Se agregó el script de Google Maps:

```html
<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY">
</script>
```

### 2. `src/app/features/home/pages/home-page/home-page.component.ts`
- Componente actualizado con métodos para inicializar el mapa
- Métodos para agregar marcadores e info windows
- Método para centrar el mapa

### 3. `src/app/features/home/pages/home-page/home-page.component.html`
- Agregado contenedor del mapa con referencia `#mapContainer`
- Leyenda del mapa en la esquina inferior derecha

### 4. `src/app/features/home/pages/home-page/home-page.component.css`
- Estilos para el contenedor del mapa (100% ancho/alto)
- Estilos responsivos para la leyenda
- Estilos para los controles de Google Maps

## Configuración Requerida

### Paso 1: Obtener API Key de Google Maps

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto
3. Ir a "APIs & Services" → "Library"
4. Buscar "Maps JavaScript API"
5. Habilitar la API
6. Ir a "APIs & Services" → "Credentials"
7. Crear una nueva "API Key"
8. Copiar la API Key

### Paso 2: Configurar la API Key

Reemplazar `YOUR_API_KEY` en `src/index.html`:

```html
<!-- ANTES -->
<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY">
</script>

<!-- DESPUÉS -->
<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD...">
</script>
```

### Paso 3: Restricciones de Seguridad (Recomendado)

En Google Cloud Console, configurar restricciones de API Key:

1. Seleccionar la API Key
2. En "Application restrictions", elegir "HTTP referrers"
3. Agregar tu dominio (ej: `localhost:4200`, `example.com`)
4. En "API restrictions", seleccionar "Maps JavaScript API"

## Características Implementadas

### Map Initialization
- Centro: Ecuador (-1.831239, -78.183406)
- Zoom inicial: 7
- Controles: Zoom, Fullscreen, Map Type

```typescript
const mapOptions = {
  zoom: 7,
  center: { lat: -1.831239, lng: -78.183406 },
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  fullscreenControl: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true
};
```

### Métodos Disponibles

#### `addMarker(lat, lng, title, description)`
Agrega un marcador con info window al mapa.

```typescript
// Ejemplo
this.homeComponent.addMarker(
  -0.222, 
  -78.5, 
  'Hospital Central', 
  'Hospital General - Quito'
);
```

#### `centerMap(lat, lng, zoom)`
Centra el mapa en una coordenada específica.

```typescript
// Ejemplo
this.homeComponent.centerMap(-0.222, -78.5, 12);
```

## Layout Responsivo

```
┌─────────────────────────────────────┐
│         HEADER (2rem)               │
│  Rural MSP | Healthcare Facilities  │
└─────────────────────────────────────┘
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │     GOOGLE MAP (flex: 1)    │   │
│  │                             │   │
│  │  ┌──────────────────────┐   │   │
│  │  │ Ecuador Health       │   │   │
│  │  │ Facilities           │   │   │
│  │  │ (Legend)             │   │   │
│  │  └──────────────────────┘   │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
│  © 2026 Rural MSP. All rights...    │
└─────────────────────────────────────┘
```

### Breakpoints
- **Desktop** (≥769px): Leyenda con tamaño normal
- **Tablet** (768px - 481px): Leyenda comprimida
- **Mobile** (≤480px): Leyenda muy comprimida

## Próximas Integraciones

### PlacesService Integration
Para agregar marcadores de establecimientos:

```typescript
constructor(private placesService: PlacesService) {}

ngOnInit(): void {
  this.initializeMap();
  
  this.placesService.places$
    .subscribe(places => {
      places.forEach(place => {
        if (place.hasLocation) {
          this.addMarker(
            place.latitude,
            place.longitude,
            place.name,
            place.type
          );
        }
      });
    });
}
```

## Troubleshooting

### "Google is not defined"
- Verificar que el script de Google Maps esté en `index.html`
- Verificar que `declare var google: any;` está en el componente
- Revisar que la API Key es válida

### "Map doesn't render"
- Verificar que `mapContainer` existe y tiene dimensiones
- Revisar console.log para "✅ Google Maps initialized"
- Verificar que `#mapContainer` tiene ancho y alto

### "API Key is invalid"
- Reemplazar `YOUR_API_KEY` con una API Key válida
- Verificar que "Maps JavaScript API" está habilitada
- Revisar restricciones de dominio

### Mapa se ve cortado o mal posicionado
- Verificar estilos CSS del `.map-container`
- Revisar que `home-main` tiene `flex: 1`
- Probar en navegador con DevTools (F12)

## Seguridad

⚠️ **IMPORTANTE**: Nunca commits una API Key válida a Git.

### Opciones:

1. **Variables de entorno** (Recomendado)
   ```typescript
   // environment.ts
   export const environment = {
     googleMapsApiKey: process.env['GOOGLE_MAPS_API_KEY']
   };
   ```

2. **Environment file**
   ```
   # .env (agregar a .gitignore)
   GOOGLE_MAPS_API_KEY=AIzaSyD...
   ```

3. **GitHub Secrets** (Para CI/CD)
   ```yaml
   # .github/workflows/build.yml
   env:
     GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
   ```

## Performance

- Google Maps se carga asincronamente (`async defer`)
- Mapa se inicializa con 100ms delay (espera al renderizado)
- Info windows se crean bajo demanda (al hacer click)
- Leyenda se posiciona absolutamente (no afecta layout)

## Documentación

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Map Options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions)
- [Markers](https://developers.google.com/maps/documentation/javascript/markers)
- [Info Windows](https://developers.google.com/maps/documentation/javascript/infowindows)

## Testing

```bash
# Iniciar la aplicación
cd project/rural
npm start

# Visitar en navegador
http://localhost:4200/

# Abrir DevTools (F12)
# Ver en Console:
# ✅ Google Maps initialized

# Verificar en Network:
# maps.googleapis.com/maps/api/js?key=...
```

---

**Próximo paso**: Reemplazar `YOUR_API_KEY` en `src/index.html` con tu API Key válida.
