---
inclusion: auto
---

# CSV Geolocation Processing Guide

---

## Descripción General

Esta guía proporciona los estándares y mejores prácticas para procesar archivos CSV relacionados con ubicaciones geográficas del MSP (Ministerio de Salud Pública).

El flujo principal es:
1. **Lectura**: Procesar archivo CSV de plazas sanitarias
2. **Peticiones**: Ejecutar curl para obtener coordenadas geográficas
3. **Extracción**: Extraer latitud/longitud de las respuestas
4. **Salida**: Generar CSV enriquecido con datos geográficos

---

## Archivos Relacionados

### CSV Origen
- **Ubicación**: `sourcce/plazas_msp_septiembre_2025_agosto_2026.csv`
- **Descripción**: Lista de establecimientos de salud con información de plazas disponibles
- **Columnas**: Nro, Zona, Distrito, Provincia, Canton, Unicodigo, Establecimiento, Tipologia, Numero de plazas, Carrera, Pagina

### CSV Destino
- **Ubicación**: `public/plazas_msp_septiembre_2025_agosto_2026_con_coords.csv`
- **Descripción**: CSV original enriquecido con coordenadas geográficas
- **Columnas Nuevas**: LAT, LONG (agregadas al final)

### Scripts de Procesamiento
- **Script Principal**: `scripts/process_csv.sh`
- **Script de Prueba**: `scripts/test_curl.sh`

---

## API Endpoint - GeoSalud MSP

### URL Base
```
https://geosalud.msp.gob.ec/geovisualizador/index.php
```

### Método
```
POST
```

### Headers Requeridos
```
Accept: */*
Accept-Language: es-US,es;q=0.9,en-US;q=0.8,en;q=0.7,es-419;q=0.6
Connection: keep-alive
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
Origin: https://geosalud.msp.gob.ec
Referer: https://geosalud.msp.gob.ec/geovisualizador/index.php
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
X-Requested-With: XMLHttpRequest
sec-ch-ua: "Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows"
Cookie: [Token Session]
```

### Body (URL Encoded)
```
accion=despliegaMarker&parm={"app":"oa","con": {"tp":"sear","wc":"1=1","id":"[UNICODIGO]","cluster":"0"} }
```

**Parámetro clave**: `id` debe reemplazarse con el `Unicodigo` de cada establecimiento.

---

## Respuesta del Endpoint

### Formato
JavaScript con asignaciones de objetos Leaflet

### Estructura
```javascript
J.i218 = L.icon({iconUrl:"./src/img/ico/oa/218.png"});
J.oaes1693=L.marker([0.138377980423831,-78.0758682896057],{
  icon: J.i218,
  tp:"218",
  id:"1693"
}).on("click",cM).on("mouseover",ovM).on("mouseout",ouM);
J.oaesM=L.layerGroup([J.oaes1693,]);
juk.map.addLayer(J.oaesM);
J.oaes1693.addTo(J.mapui);
juk.map.fitBounds(J.mapui.getBounds(),{padding: [40, 40]});
```

### Extracción de Coordenadas

**Patrón a buscar**: `L.marker([LAT,LON])`

**Regex**: `L\.marker\(\[\K[0-9.-]+,[0-9.-]+`

**Ejemplo**:
- Entrada: `L.marker([0.138377980423831,-78.0758682896057])`
- Salida: `0.138377980423831,-78.0758682896057`
- Latitud: `0.138377980423831`
- Longitud: `-78.0758682896057`

---

## Scripts Bash - Guía de Uso

### Script Principal: `process_csv.sh`

**Propósito**: Procesar todos los registros del CSV y enriquecer con coordenadas

**Ejecución**:
```bash
cd scripts/
./process_csv.sh
```

**Flujo**:
1. Lee el archivo CSV origen
2. Para cada registro (excepto encabezado):
   - Extrae el `Unicodigo`
   - Ejecuta petición curl al endpoint
   - Extrae coordenadas de la respuesta
   - Guarda respuesta en `responses/response_[UNICODIGO].js`
   - Añade fila al CSV destino con coordenadas
3. Genera estadísticas finales

**Pausa entre peticiones**: 2 segundos (para no sobrecargar el servidor)

**Salida**:
- CSV enriquecido en `plazas_msp_septiembre_2025_agosto_2026_con_coords.csv`
- Respuestas en carpeta `responses/`
- Estadísticas en console

### Script de Prueba: `test_curl.sh`

**Propósito**: Probar el endpoint con el primer registro

**Ejecución**:
```bash
cd scripts/
./test_curl.sh
```

**Funcionalidad**:
- Lee el primer registro del CSV
- Muestra los datos del registro
- Imprime el comando curl a ejecutar (sin ejecutar)
- Permite verificar que los parámetros sean correctos

---

## Manejo de Errores

### Casos Comunes

| Caso | Causa | Solución |
|------|-------|----------|
| Coordenadas vacías | No se encontró patrón `L.marker` | Verificar respuesta del endpoint |
| Error 401 | Cookie expirada o inválida | Actualizar COOKIES en el script |
| Error 403 | IP bloqueada o acceso denegado | Esperar o usar proxy |
| Error 500 | Problema en el servidor remoto | Reintentar más tarde |
| Timeout | Servidor muy lento | Aumentar timeout de curl |

### Gestión de Fallos en CSV

Cuando hay error o no se encuentran coordenadas:
- Las columnas LAT y LONG quedan **vacías** (`,`)
- La fila se guarda igual en el CSV
- Se registra un ⚠ o ✗ en console

---

## Estructura del Archivo CSV Enriquecido

### Encabezados
```
Nro,Zona,Distrito,Provincia,Canton,Unicodigo,Establecimiento,Tipologia,Numero de plazas,Carrera,Pagina,LAT,LONG
```

### Ejemplo de Fila Exitosa
```
1,Z01,04D01,CARCHI,TULCAN,002996,BABOSO,PUESTO DE SALUD,1,ENFERMERIA,1,0.138377980423831,-78.0758682896057
```

### Ejemplo de Fila Sin Coordenadas
```
2,Z01,04D01,CARCHI,TULCAN,000288,CHICAL,CENTRO DE SALUD A,2,ENFERMERIA,1,,
```

---

## Integración en Angular

### Carga del CSV en el Proyecto

El CSV enriquecido se copiará a `public/plazas_msp_septiembre_2025_agosto_2026_con_coords.csv` y será accesible desde Angular.

### Lectura del CSV en Servicio

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IPlaza {
  nro: number;
  zona: string;
  distrito: string;
  provincia: string;
  canton: string;
  unicodigo: string;
  establecimiento: string;
  tipologia: string;
  numeroDePlazas: number;
  carrera: string;
  pagina: number;
  lat: number;
  long: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlazasService {

  private readonly CSV_URL = '/plazas_msp_septiembre_2025_agosto_2026_con_coords.csv';

  constructor(private http: HttpClient) {}

  getPlazas(): Observable<string> {
    return this.http.get(this.CSV_URL, { responseType: 'text' });
  }

  parseCsv(csvContent: string): IPlaza[] {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        return {
          nro: parseInt(values[0]),
          zona: values[1],
          distrito: values[2],
          provincia: values[3],
          canton: values[4],
          unicodigo: values[5],
          establecimiento: values[6],
          tipologia: values[7],
          numeroDePlazas: parseInt(values[8]),
          carrera: values[9],
          pagina: parseInt(values[10]),
          lat: parseFloat(values[11]) || 0,
          long: parseFloat(values[12]) || 0
        };
      });
  }
}
```

### Uso en Componente

```typescript
import { Component, OnInit } from '@angular/core';
import { PlazasService, IPlaza } from '../services/plazas.service';

@Component({
  selector: 'app-plazas-map',
  standalone: true,
  templateUrl: './plazas-map.component.html'
})
export class PlazasMapComponent implements OnInit {

  plazas: IPlaza[] = [];
  isLoading = true;

  constructor(private plazasService: PlazasService) {}

  ngOnInit(): void {
    this.loadPlazas();
  }

  private loadPlazas(): void {
    this.plazasService.getPlazas().subscribe({
      next: (csvContent) => {
        this.plazas = this.plazasService.parseCsv(csvContent);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando plazas:', error);
        this.isLoading = false;
      }
    });
  }
}
```

---

## Performance y Consideraciones

### Volumen de Datos
- **Registros típicos**: ~350+ establecimientos
- **Tiempo estimado**: ~12 minutos (2 segundos por petición)
- **Tamaño CSV origen**: ~50 KB
- **Tamaño CSV destino**: ~70 KB (con coordenadas)

### Optimizaciones
1. **Pausa de 2 segundos**: Evita rate limiting del servidor
2. **Guardado incremental**: Cada fila se guarda mientras se procesa
3. **Respuestas cacheadas**: Se guardan en `responses/` para auditoría

### Reintentos
Si el script se interrumpe:
1. Edita el CSV manualmente para comentar filas ya procesadas
2. O, reinicia el script (habrá líneas duplicadas)
3. O, remueve el CSV destino y comienza desde cero

---

## Checklist de Ejecución

- [ ] Script `process_csv.sh` es ejecutable (`chmod +x process_csv.sh`)
- [ ] Archivo origen existe en `sourcce/plazas_msp_septiembre_2025_agosto_2026.csv`
- [ ] Conexión a internet disponible
- [ ] Session cookie válida en el script
- [ ] Carpeta `responses/` se crea automáticamente
- [ ] CSV destino se genera en `plazas_msp_septiembre_2025_agosto_2026_con_coords.csv`
- [ ] Verificar que columnas LAT y LONG no estén vacías en más del 5% de registros

---

## Troubleshooting

### "Error: El archivo no existe"
- Verifica la ruta del CSV origen
- Asegúrate de estar en la carpeta `scripts/`

### "No se encontraron coordenadas"
- Verifica que el endpoint responda correctamente
- Prueba con `test_curl.sh` primero
- Revisa si la cookie está expirada

### "Timeout o conexión rechazada"
- Verifica conexión a internet
- Espera unos minutos antes de reintentar
- Revisa si la IP está bloqueada

### CSV generado pero sin datos
- Reinicia el script completamente
- Limpia el archivo CSV destino
- Verifica logs de respuestas en `responses/`

---

## Referencias

- [Bash Scripting Guide](https://www.gnu.org/software/bash/manual/)
- [curl Documentation](https://curl.se/docs/)
- [CSV Standard Format](https://tools.ietf.org/html/rfc4180)
- [Leaflet.js Documentation](https://leafletjs.com/)

</content>
