# Places Feature

## Overview

Feature para gestionar y visualizar datos de establecimientos sanitarios del MSP (Ministerio de Salud Pública) del Ecuador.

## Structure

```
features/places/
├── pages/
│   └── places-list/
│       ├── places-list.component.ts
│       ├── places-list.component.html
│       └── places-list.component.css
└── README.md
```

## Services

### PlacesService

Located at: `src/app/core/services/places.service.ts`

Responsable de:
- Cargar el CSV de establecimientos sanitarios
- Parsear datos CSV a formato JSON
- Proporcionar observables reactivos con los datos
- Implementar búsqueda y filtrado
- Gestionar caché local (24 horas)
- Estadísticas de establecimientos

#### Usage

```typescript
import { PlacesService } from '@core/services/places.service';

@Component({...})
export class MyComponent {
  places$ = this.placesService.places$;
  loading$ = this.placesService.loading$;

  constructor(private placesService: PlacesService) {}

  ngOnInit(): void {
    // Auto-load from cache or CSV
    this.placesService.getPlaces()
      .subscribe({
        next: (places) => console.log(places),
        error: (err) => console.error(err)
      });
  }

  // Search
  search(term: string) {
    this.placesService.search(term).subscribe(...);
  }

  // Filter by province
  filterByProvince(province: string) {
    this.placesService.filterByProvince(province).subscribe(...);
  }

  // Filter by type
  filterByType(type: string) {
    this.placesService.filterByType(type).subscribe(...);
  }

  // Get statistics
  getStats() {
    this.placesService.getStatistics().subscribe(...);
  }
}
```

## Data Model

### Place Interface

```typescript
export interface Place {
  id: number;                  // Sequential number
  zone: string;                // e.g., "Z01"
  district: string;            // e.g., "04D01"
  province: string;            // e.g., "CARCHI"
  canton: string;              // e.g., "TULCAN"
  code: string;                // Unique code (Unicodigo)
  name: string;                // Establishment name
  type: string;                // e.g., "PUESTO DE SALUD", "CENTRO DE SALUD A"
  availableSlots: number;      // Number of available slots
  specialization: string;      // e.g., "ENFERMERIA"
  page: number;                // Page number
  latitude: number;            // Geographic latitude
  longitude: number;           // Geographic longitude
  hasLocation?: boolean;       // Computed: has valid coordinates
}
```

## CSV Format

**Source**: `public/plazas_msp_septiembre_2025_agosto_2026_con_coords.csv`

**Columns**:
```
Nro,Zona,Distrito,Provincia,Canton,Unicodigo,Establecimiento,Tipologia,Numero de plazas,Carrera,Pagina,Latitud,Longitud
```

**Example**:
```
1,Z01,04D01,CARCHI,TULCAN,002996,BABOSO,PUESTO DE SALUD,1,ENFERMERIA,1,0.893280129492066,-78.44851127975
```

## Components

### PlacesListComponent

Muestra un listado con búsqueda y filtrado de establecimientos.

**Features**:
- Tabla responsive con información de establecimientos
- Búsqueda con debounce (300ms)
- Filtrado por tipo de establecimiento
- Indicador de ubicación (geolocalización)
- Contador de plazas disponibles
- Refresh y clear cache buttons
- Estados de carga y error

## Performance

- **Caching**: 24 horas en localStorage
- **Debounce**: 300ms en búsqueda para reducir operaciones
- **Lazy Loading**: CSV se carga una sola vez
- **Observable Patterns**: Uso de async pipe para optimizar detección de cambios

## Type System

| Tipo | Características | Color |
|------|---|---|
| PUESTO DE SALUD | Básico, rural | Rojo |
| CENTRO DE SALUD A | Atención primaria | Naranja |
| CENTRO DE SALUD B | Atención ampliada | Amarillo |
| CENTRO DE SALUD C | Atención especializada | Verde |
| HOSPITAL BASICO | Hospitales básicos | Azul |
| HOSPITAL GENERAL | Hospitales generales | Morado |
| HOSPITAL ESPECIALIZADO | Hospitales especializados | Rosa |

## Error Handling

El servicio proporciona un observable `error$` que emite mensajes cuando hay errores:

```typescript
this.placesService.error$.subscribe(error => {
  if (error) {
    // Show toast or notification
    console.error(error);
  }
});
```

## Future Enhancements

- [ ] Integración con mapas (Leaflet/Mapbox)
- [ ] Cálculo de distancias geográficas
- [ ] Exportación a formatos (JSON, GeoJSON, Excel)
- [ ] Geoding reverso
- [ ] Análisis geoespacial avanzado
- [ ] API backend para datos en tiempo real

## References

- [PlacesService](../../core/services/places.service.ts)
- [Place Model](../../core/models/place.ts)
- [StorageService](../../core/services/storage.service.ts)
