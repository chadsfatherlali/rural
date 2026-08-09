# PlacesService - CSV to JSON Implementation

## 📋 Overview

Se ha implementado un servicio completo (`PlacesService`) que lee el archivo CSV de establecimientos sanitarios del MSP y lo convierte a formato JSON con todas las características de búsqueda, filtrado, caching y manejo reactivo.

## 📁 Estructura de Archivos Creados

```
src/app/
├── core/
│   ├── models/
│   │   └── place.ts                    # Interface Place
│   └── services/
│       ├── places.service.ts           # Servicio principal
│       └── storage.service.ts          # Servicio de almacenamiento (opcional)
├── features/
│   └── places/
│       ├── pages/
│       │   └── places-list/
│       │       ├── places-list.component.ts
│       │       ├── places-list.component.html
│       │       └── places-list.component.css
│       └── README.md
└── app.config.ts                       # (modificado - agregado provideHttpClient)
```

## 🔧 Configuración

### app.config.ts

Se agregó `provideHttpClient()` a la configuración de la aplicación para habilitar las peticiones HTTP:

```typescript
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    // ... otros providers
  ]
};
```

## 📊 Modelo de Datos: Place

```typescript
interface Place {
  id: number;                  // Número secuencial
  zone: string;                // e.g., "Z01"
  district: string;            // e.g., "04D01"
  province: string;            // e.g., "CARCHI"
  canton: string;              // e.g., "TULCAN"
  code: string;                // Código único (Unicodigo)
  name: string;                // Nombre del establecimiento
  type: string;                // Tipología (PUESTO DE SALUD, CENTRO DE SALUD A, etc.)
  availableSlots: number;      // Número de plazas disponibles
  specialization: string;      // e.g., "ENFERMERIA"
  page: number;                // Número de página
  latitude: number;            // Latitud geográfica
  longitude: number;           // Longitud geográfica
  hasLocation?: boolean;       // Indicador computado (tiene coordenadas válidas)
}
```

## 🚀 API del PlacesService

### Métodos Principales

#### `getPlaces(): Observable<Place[]>`
Carga los establecimientos del CSV (con caching automático)

```typescript
this.placesService.getPlaces().subscribe({
  next: (places) => console.log(places),
  error: (err) => console.error(err)
});
```

#### `search(term: string): Observable<Place[]>`
Busca establecimientos por término (nombre, provincia, código, etc.)

```typescript
this.placesService.search('TULCAN').subscribe(results => {
  console.log(results);
});
```

#### `filterByProvince(province: string): Observable<Place[]>`
Filtra establecimientos por provincia

```typescript
this.placesService.filterByProvince('CARCHI').subscribe(places => {
  console.log(places);
});
```

#### `filterByType(type: string): Observable<Place[]>`
Filtra establecimientos por tipo

```typescript
this.placesService.filterByType('CENTRO DE SALUD A').subscribe(places => {
  console.log(places);
});
```

#### `filterByZone(zone: string): Observable<Place[]>`
Filtra establecimientos por zona

```typescript
this.placesService.filterByZone('Z01').subscribe(places => {
  console.log(places);
});
```

#### `getByCode(code: string): Observable<Place | undefined>`
Obtiene un establecimiento específico por código

```typescript
this.placesService.getByCode('002996').subscribe(place => {
  console.log(place);
});
```

#### `getStatistics(): Observable<Statistics>`
Obtiene estadísticas generales

```typescript
this.placesService.getStatistics().subscribe(stats => {
  console.log(stats.total);              // Total de establecimientos
  console.log(stats.withLocation);       // Con geolocalización
  console.log(stats.withoutLocation);    // Sin geolocalización
  console.log(stats.totalSlots);         // Total de plazas
  console.log(stats.provinces);          // Set de provincias
  console.log(stats.types);              // Set de tipos
});
```

#### `sortBy(places: Place[], field: keyof Place, ascending: boolean): Place[]`
Ordena establecimientos por un campo

```typescript
const sorted = this.placesService.sortBy(places, 'availableSlots', false);
```

#### `clearCache(): void`
Limpia el caché local

```typescript
this.placesService.clearCache();
```

### Observables Reactivos

#### `places$: Observable<Place[]>`
Observable con todos los establecimientos cargados

```typescript
this.placesService.places$.subscribe(places => {
  console.log(places);
});
```

#### `loading$: Observable<boolean>`
Observable que indica si se está cargando

```typescript
this.placesService.loading$.subscribe(isLoading => {
  console.log(isLoading ? 'Cargando...' : 'Listo');
});
```

#### `error$: Observable<string | null>`
Observable que emite errores

```typescript
this.placesService.error$.subscribe(error => {
  if (error) console.error(error);
});
```

## 💾 Caching

- **Ubicación**: localStorage
- **Clave**: `places_cache`
- **Duración**: 24 horas
- **Formato**: JSON con timestamp

El servicio automáticamente:
1. Intenta cargar datos del caché al inicializar
2. Guarda datos en caché después de cada carga exitosa
3. Invalida el caché después de 24 horas

## 📈 Performance

- **Debounce en búsqueda**: 300ms (en componentes)
- **Carga única**: El CSV se carga una sola vez
- **Lazy loading**: Datos se cargan bajo demanda
- **Observable patterns**: Uso de async pipe para optimizar detección de cambios

## 🎨 Componente de Ejemplo: PlacesListComponent

Se incluye un componente completo que demuestra el uso del servicio con:

- Tabla responsive con información de establecimientos
- Búsqueda con debounce
- Filtrado por tipo
- Indicadores de ubicación geográfica
- Contador de plazas disponibles
- Estados de carga y error

### Uso

```typescript
import { PlacesListComponent } from '@features/places/pages/places-list/places-list.component';

@NgModule({
  imports: [PlacesListComponent]
})
export class AppModule {}
```

O en rutas:

```typescript
{
  path: 'places',
  component: PlacesListComponent
}
```

## 📄 Formato del CSV

**Origen**: `public/plazas_msp_septiembre_2025_agosto_2026_con_coords.csv`

**Columnas**:
```
Nro, Zona, Distrito, Provincia, Canton, Unicodigo, Establecimiento, Tipologia, Numero de plazas, Carrera, Pagina, Latitud, Longitud
```

**Ejemplo**:
```csv
1,Z01,04D01,CARCHI,TULCAN,002996,BABOSO,PUESTO DE SALUD,1,ENFERMERIA,1,0.893280129492066,-78.44851127975
```

## 🔍 Ejemplo Completo de Uso

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlacesService } from '@core/services/places.service';
import { Place } from '@core/models/place';

@Component({
  selector: 'app-example',
  template: `
    <div>
      <h1>{{ title }}</h1>
      
      @if (loading$ | async) {
        <p>Cargando...</p>
      } @else {
        <p>Total: {{ (places$ | async)?.length }}</p>
        
        @for (place of (places$ | async); track place.code) {
          <div>
            <h3>{{ place.name }}</h3>
            <p>{{ place.type }} - {{ place.province }}, {{ place.canton }}</p>
            <p>Plazas: {{ place.availableSlots }}</p>
          </div>
        }
      }
    </div>
  `
})
export class ExampleComponent implements OnInit, OnDestroy {

  title = 'Establecimientos Sanitarios';
  places$ = this.placesService.places$;
  loading$ = this.placesService.loading$;

  private destroy$ = new Subject<void>();

  constructor(private placesService: PlacesService) {}

  ngOnInit(): void {

    // Cargar establecimientos
    this.placesService.getPlaces()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (places) => {
          console.log(`Cargados ${places.length} establecimientos`);
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });

    // Obtener estadísticas
    this.placesService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        console.log('Estadísticas:', stats);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buscar(termino: string): void {
    this.placesService.search(termino)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        console.log(`${results.length} resultados encontrados`);
      });
  }
}
```

## ✅ Características Incluidas

- ✅ Parsing automático de CSV a JSON
- ✅ Tipado fuerte con TypeScript (interface Place)
- ✅ Caching local (localStorage) con expiración de 24h
- ✅ Búsqueda case-insensitive
- ✅ Filtrado por múltiples criterios
- ✅ Estadísticas agregadas
- ✅ Observables reactivos (RxJS)
- ✅ Manejo de errores
- ✅ Estados de carga
- ✅ Componente ejemplo completo
- ✅ Validaciones y sanitización de datos

## 🚧 Próximas Mejoras

- [ ] Integración con mapas (Leaflet/Mapbox)
- [ ] Cálculo de distancias geográficas
- [ ] Exportación a formatos (JSON, GeoJSON, Excel)
- [ ] Geoding reverso
- [ ] Paginación para tablas grandes
- [ ] API backend para datos en tiempo real
- [ ] Tests unitarios

## 📝 Archivos Generados

1. `src/app/core/models/place.ts` - Interfaz de datos
2. `src/app/core/services/places.service.ts` - Servicio principal
3. `src/app/core/services/storage.service.ts` - Servicio de almacenamiento
4. `src/app/features/places/pages/places-list/places-list.component.ts` - Componente
5. `src/app/features/places/pages/places-list/places-list.component.html` - Template
6. `src/app/features/places/pages/places-list/places-list.component.css` - Estilos
7. `src/app/features/places/README.md` - Documentación de feature
8. `src/app/app.config.ts` - (modificado)

---

## 📚 References

- [PlacesService Documentation](src/app/features/places/README.md)
- [Place Model](src/app/core/models/place.ts)
- [Angular HTTP Client Docs](https://angular.io/guide/http)
- [RxJS Documentation](https://rxjs.dev/)
