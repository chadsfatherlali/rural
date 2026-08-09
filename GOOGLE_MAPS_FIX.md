# Google Maps - Loading Fix

## Problema

El error `ReferenceError: google is not defined` ocurría porque el script de Google Maps se cargaba asincronamente, pero el componente intentaba usarlo antes de que estuviera disponible.

## Solución Implementada

### 1. Callback en index.html

Se agregó un callback a la URL de Google Maps API:

```html
<script>
  window.googleMapsReady = false;
  
  window.initGoogleMaps = function() {
    window.googleMapsReady = true;
    console.log('📍 Google Maps API loaded');
    document.dispatchEvent(new Event('googleMapsLoaded'));
  };
</script>

<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initGoogleMaps">
</script>
```

### 2. Espera en el Componente

Se implementó un método `waitForGoogleMaps()` que:
- Verifica si Google Maps ya está cargado
- Si no, espera hasta 10 segundos a que se cargue
- Ejecuta `createMap()` una vez disponible

```typescript
private waitForGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    
    // Si ya está cargado
    if (typeof google !== 'undefined' && google.maps) {
      resolve();
      return;
    }

    // Esperar con polling (max 10 segundos)
    let attempts = 0;
    const maxAttempts = 100; // 100 * 100ms = 10 segundos

    const checkGoogle = setInterval(() => {
      attempts++;

      if (typeof google !== 'undefined' && google.maps) {
        clearInterval(checkGoogle);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkGoogle);
        reject(new Error('Google Maps API did not load within 10 seconds'));
      }
    }, 100);
  });
}
```

## Flujo de Carga

```
1. index.html carga
   ↓
2. Script de Google Maps comienza a cargar (async defer)
   ↓
3. App Angular bootstrap
   ↓
4. HomePageComponent ngOnInit
   ↓
5. initializeMap() → waitForGoogleMaps()
   ↓
6. Espera a que google.maps esté disponible (polling)
   ↓
7. createMap() → Crea el mapa
   ↓
8. ✅ Google Maps initialized successfully
```

## Configuración Requerida

### 1. Reemplazar API Key

En `src/index.html`, reemplazar `YOUR_API_KEY`:

```html
<!-- ANTES -->
<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initGoogleMaps">
</script>

<!-- DESPUÉS -->
<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD1234567890...&callback=initGoogleMaps">
</script>
```

### 2. Obtener API Key

1. [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto
3. "APIs & Services" → "Library"
4. Buscar "Maps JavaScript API"
5. Habilitar
6. "Credentials" → Crear "API Key"
7. Copiar la key

## Console Output

Cuando el mapa carga correctamente, verás:

```
📍 Google Maps API loaded
✅ Google Maps initialized successfully
```

## Troubleshooting

### Error: "Google Maps API did not load within 10 seconds"

**Causa**: El script de Google Maps no se cargó a tiempo

**Soluciones**:
1. Verificar conexión a internet
2. Verificar que la API Key es válida
3. Aumentar `maxAttempts` en el componente (ej: 150 para 15 segundos)

### Error: "Invalid API Key"

**Causa**: La API Key es incorrecta o está deshabilitada

**Soluciones**:
1. Verificar que copiaste correctamente la key
2. Verificar en Google Cloud Console que la key está activa
3. Verificar que "Maps JavaScript API" está habilitada

### Mapa no renderiza

**Causa**: mapContainer no está listo

**Soluciones**:
1. Verificar que `#mapContainer` existe en el HTML
2. Verificar que tiene dimensiones (width/height)
3. Revisar en DevTools que el elemento existe

## Mejoras Implementadas

✅ **Async Loading**
- Google Maps se carga sin bloquear el renderizado

✅ **Polling**
- El componente espera a que Google esté disponible

✅ **Callback**
- index.html dispara evento cuando Google Maps está listo

✅ **Error Handling**
- Rechaza promise si se excede timeout

✅ **Console Logging**
- Mensajes claros de estado

## Testing

```bash
# Iniciar app
npm start

# En el navegador DevTools (F12):
# Console tab debe mostrar:
# 📍 Google Maps API loaded
# ✅ Google Maps initialized successfully

# Network tab:
# Verificar que maps.googleapis.com/maps/api/js carga exitosamente
```

## Performance Metrics

- **Script load time**: ~2-3 segundos (depende conexión)
- **Polling delay**: 100ms (100 checks en 10 segundos)
- **Map creation**: ~300ms después de que Google esté disponible

## Próximas Optimizaciones

- [ ] Usar @angular/google-maps library (oficial)
- [ ] Implementar lazy loading del script
- [ ] Agregar Service Worker para cache
- [ ] Usar Google Maps Web Component

## Referencia

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [API Loading Strategies](https://developers.google.com/maps/documentation/javascript/load-maps-js-api)
