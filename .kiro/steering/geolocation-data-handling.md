---
inclusion: auto
---

# Geolocation Data Handling - Rural MSP

## Overview

Guía completa para manejar datos de geolocalización de establecimientos sanitarios del MSP en la aplicación Angular. Incluye parsing, visualización, filtrado y caching de coordenadas.

---

## Estructura de Datos

### Interface Principal: IPlaza

```typescript
// src/core/models/plaza.ts

export interface IPlaza {
  // Información administrativa
  nro: number;
  zona: string;
  distrito: string;
  provincia: string;
  canton: string;
  
  // Identidad
  unicodigo: string;
  establecimiento: string;
  
  // Características
  tipologia: string;        // e.g., "CENTRO DE SALUD A", "PUESTO DE SALUD"
  numeroDePlazas: number;   // Plazas disponibles
  carrera: string;          // e.g., "ENFERMERIA"
  
  // Paginación y auditoría
  pagina: number;
  
  // Geolocalización
  lat: number;
  long: number;
  
  // Computed (opcional)
  tieneUbicacion?: boolean; // lat !== 0 && long !== 0
  distancia?: number;       // Distancia a ubicación del usuario
}
```

### Mapeo de Tipologías

```typescript
// src/core/constants/tipologia.constants.ts

export const TIPOLOGIA_NIVELES = {
  'PUESTO DE SALUD': 1,
  'CENTRO DE SALUD A': 2,
  'CENTRO DE SALUD B': 3,
  'CENTRO DE SALUD C': 4,
  'HOSPITAL BASICO': 5,
  'HOSPITAL GENERAL': 6,
  'HOSPITAL ESPECIALIZADO': 7
} as const;

export const TIPOLOGIA_ICONOS = {
  'PUESTO DE SALUD': 'pi-home',
  'CENTRO DE SALUD A': 'pi-map-marker',
  'CENTRO DE SALUD B': 'pi-map-marker',
  'CENTRO DE SALUD C': 'pi-map-marker',
  'HOSPITAL BASICO': 'pi-building',
  'HOSPITAL GENERAL': 'pi-building',
  'HOSPITAL ESPECIALIZADO': 'pi-building'
} as const;
```

---

## Servicio de Plazas

### PlazasService - Completo

```typescript
// src/core/services/plazas.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError } from 'rxjs';
import { throwError } from 'rxjs';

import { IPlaza } from '../models/plaza';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class PlazasService {

  private readonly CSV_URL = '/plazas_msp_septiembre_2025_agosto_2026_con_coords.csv';
  private readonly CACHE_KEY = 'plazas_cache';
  private readonly CACHE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas

  private plazasSubject = new BehaviorSubject<IPlaza[]>([]);
  public plazas$ = this.plazasSubject.asObservable();

  private cargandoSubject = new BehaviorSubject<boolean>(false);
  public cargando$ = this.cargandoSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.inicializarPlazas();
  }

  // Grupo 1: Inicialización
  private inicializarPlazas(): void {

    // Grupo 1.1: Intentar cargar del cache
    const plazasEnCache = this.cargarDelCache();
    if (plazasEnCache && plazasEnCache.length > 0) {
      this.plazasSubject.next(plazasEnCache);
      return;
    }

    // Grupo 1.2: Cargar desde archivo
    this.cargarPlazas();
  }

  // Grupo 2: Carga de datos
  cargarPlazas(): Observable<IPlaza[]> {

    // Grupo 2.1: Establecer estado de carga
    this.cargandoSubject.next(true);
    this.errorSubject.next(null);

    // Grupo 2.2: Obtener CSV
    return this.http.get(this.CSV_URL, { responseType: 'text' })
      .pipe(
        map(csvContent => this.parsearCsv(csvContent)),
        tap(plazas => {

          // Grupo 2.3: Guardar en subject
          this.plazasSubject.next(plazas);

          // Grupo 2.4: Guardar en cache
          this.guardarEnCache(plazas);

          // Grupo 2.5: Actualizar estado
          this.cargandoSubject.next(false);
        }),
        catchError(error => {

          // Grupo 2.6: Manejo de errores
          const errorMsg = 'Error al cargar plazas sanitarias';
          this.errorSubject.next(errorMsg);
          this.cargandoSubject.next(false);
          console.error('Error en cargarPlazas:', error);

          return throwError(() => new Error(errorMsg));
        })
      );
  }

  // Grupo 3: Parsing del CSV
  private parsearCsv(csvContent: string): IPlaza[] {

    // Grupo 3.1: Dividir líneas
    const lineas = csvContent.trim().split('\n');
    const plazas: IPlaza[] = [];

    // Grupo 3.2: Procesar cada línea (saltando encabezado)
    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();

      // Saltar líneas vacías
      if (!linea) continue;

      // Grupo 3.3: Parsear valores
      try {
        const plaza = this.parsearLinea(linea);
        if (plaza) {
          plazas.push(plaza);
        }
      } catch (error) {
        console.warn(`Error al parsear línea ${i}:`, linea);
        continue;
      }
    }

    // Grupo 3.4: Retornar plazas procesadas
    console.log(`Se cargaron ${plazas.length} plazas correctamente`);
    return plazas;
  }

  private parsearLinea(linea: string): IPlaza | null {

    // Grupo 1: Dividir por comas
    const valores = linea.split(',').map(v => v.trim());

    // Grupo 2: Validar cantidad de columnas
    if (valores.length < 12) {
      return null;
    }

    // Grupo 3: Extraer y tipificar valores
    const nro = parseInt(valores[0]) || 0;
    const lat = parseFloat(valores[10]) || 0;
    const long = parseFloat(valores[11]) || 0;
    const numeroDePlazas = parseInt(valores[8]) || 0;

    // Grupo 4: Construir objeto IPlaza
    return {
      nro,
      zona: valores[1],
      distrito: valores[2],
      provincia: valores[3],
      canton: valores[4],
      unicodigo: valores[5],
      establecimiento: valores[6],
      tipologia: valores[7],
      numeroDePlazas,
      carrera: valores[9],
      pagina: parseInt(valores[12]) || 0,
      lat,
      long,
      tieneUbicacion: lat !== 0 && long !== 0
    };
  }

  // Grupo 4: Filtrado y búsqueda
  buscar(termino: string): Observable<IPlaza[]> {
    return this.plazas$.pipe(
      map(plazas => {

        // Grupo 1: Normalizar término
        const terminoLower = termino.toLowerCase().trim();

        // Grupo 2: Filtrar coincidencias
        return plazas.filter(plaza =>
          plaza.establecimiento.toLowerCase().includes(terminoLower) ||
          plaza.provincia.toLowerCase().includes(terminoLower) ||
          plaza.canton.toLowerCase().includes(terminoLower) ||
          plaza.zona.toLowerCase().includes(terminoLower) ||
          plaza.unicodigo.includes(terminoLower)
        );
      })
    );
  }

  filtrarPorProvincia(provincia: string): Observable<IPlaza[]> {
    return this.plazas$.pipe(
      map(plazas =>
        plazas.filter(p => p.provincia === provincia)
      )
    );
  }

  filtrarPorTipologia(tipologia: string): Observable<IPlaza[]> {
    return this.plazas$.pipe(
      map(plazas =>
        plazas.filter(p => p.tipologia === tipologia)
      )
    );
  }

  filtrarPorZona(zona: string): Observable<IPlaza[]> {
    return this.plazas$.pipe(
      map(plazas =>
        plazas.filter(p => p.zona === zona)
      )
    );
  }

  // Grupo 5: Obtener una plaza específica
  obtenerPorUnicodigo(unicodigo: string): Observable<IPlaza | undefined> {
    return this.plazas$.pipe(
      map(plazas =>
        plazas.find(p => p.unicodigo === unicodigo)
      )
    );
  }

  // Grupo 6: Estadísticas
  obtenerEstadisticas(): Observable<{
    total: number;
    conUbicacion: number;
    sinUbicacion: number;
    plazasTotales: number;
    provincias: Set<string>;
    tipologias: Set<string>;
  }> {
    return this.plazas$.pipe(
      map(plazas => ({
        total: plazas.length,
        conUbicacion: plazas.filter(p => p.tieneUbicacion).length,
        sinUbicacion: plazas.filter(p => !p.tieneUbicacion).length,
        plazasTotales: plazas.reduce((sum, p) => sum + p.numeroDePlazas, 0),
        provincias: new Set(plazas.map(p => p.provincia)),
        tipologias: new Set(plazas.map(p => p.tipologia))
      }))
    );
  }

  // Grupo 7: Ordenamiento
  ordenarPor(plazas: IPlaza[], campo: keyof IPlaza, ascendente: boolean = true): IPlaza[] {
    return [...plazas].sort((a, b) => {
      const valA = a[campo];
      const valB = b[campo];

      if (valA < valB) return ascendente ? -1 : 1;
      if (valA > valB) return ascendente ? 1 : -1;
      return 0;
    });
  }

  // Grupo 8: Cache
  private guardarEnCache(plazas: IPlaza[]): void {
    const cacheData = {
      plazas,
      timestamp: Date.now()
    };
    this.storageService.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
  }

  private cargarDelCache(): IPlaza[] | null {

    // Grupo 1: Obtener del storage
    const cached = this.storageService.getItem(this.CACHE_KEY);
    if (!cached) return null;

    // Grupo 2: Validar y parsear
    try {
      const { plazas, timestamp } = JSON.parse(cached);

      // Grupo 3: Verificar expiración
      if (Date.now() - timestamp > this.CACHE_TIMEOUT) {
        this.storageService.removeItem(this.CACHE_KEY);
        return null;
      }

      return plazas;
    } catch (error) {
      console.error('Error al cargar cache:', error);
      this.storageService.removeItem(this.CACHE_KEY);
      return null;
    }
  }

  limpiarCache(): void {
    this.storageService.removeItem(this.CACHE_KEY);
    this.plazasSubject.next([]);
  }
}
```

---

## Storage Service (Abstracción)

```typescript
// src/core/services/storage.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error al leer de localStorage:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al remover de localStorage:', error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }
}
```

---

## Componente de Ejemplo: Listado de Plazas

```typescript
// src/features/plazas/pages/plazas-list/plazas-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';

import { PlazasService } from '../../../../core/services/plazas.service';
import { IPlaza } from '../../../../core/models/plaza';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-plazas-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    ButtonDirective,
    DropdownModule
  ],
  templateUrl: './plazas-list.component.html',
  styleUrls: ['./plazas-list.component.css']
})
export class PlazasListComponent implements OnInit, OnDestroy {

  // Propiedades de datos
  plazas$ = this.plazasService.plazas$;
  cargando$ = this.plazasService.cargando$;

  // Propiedades de UI
  searchControl = new FormControl('');
  filtroTipologia = new FormControl('');
  filtroZona = new FormControl('');

  tipologiasDisponibles: string[] = [];
  zonasDisponibles: string[] = [];

  plazasFiltradasLocal: IPlaza[] = [];

  // Control de ciclo de vida
  private destroy$ = new Subject<void>();

  constructor(
    private plazasService: PlazasService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {

    // Grupo 1: Cargar plazas
    this.cargarPlazas();

    // Grupo 2: Configurar búsqueda con debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(termino => {
        if (termino) {
          this.buscar(termino);
        } else {
          this.plazas$.pipe(takeUntil(this.destroy$))
            .subscribe(plazas => this.plazasFiltradasLocal = plazas);
        }
      });

    // Grupo 3: Cambios en filtros
    this.filtroTipologia.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tipologia => {
        if (tipologia) {
          this.plazasService.filtrarPorTipologia(tipologia)
            .pipe(takeUntil(this.destroy$))
            .subscribe(plazas => this.plazasFiltradasLocal = plazas);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarPlazas(): void {

    // Grupo 1: Cargar datos
    this.plazasService.cargarPlazas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (plazas) => {

          // Grupo 1.1: Guardar localmente
          this.plazasFiltradasLocal = plazas;

          // Grupo 1.2: Extraer opciones de filtro
          this.tipologiasDisponibles = [
            ...new Set(plazas.map(p => p.tipologia))
          ].sort();

          this.zonasDisponibles = [
            ...new Set(plazas.map(p => p.zona))
          ].sort();

          // Grupo 1.3: Mostrar toast de éxito
          this.toastService.show(
            `Se cargaron ${plazas.length} establecimientos`,
            'success'
          );
        },
        error: (error) => {

          // Grupo 2: Manejo de error
          this.toastService.show(
            'Error al cargar las plazas sanitarias',
            'danger'
          );
          console.error('Error:', error);
        }
      });
  }

  private buscar(termino: string): void {

    // Grupo 1: Ejecutar búsqueda
    this.plazasService.buscar(termino)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultados) => {

          // Grupo 1.1: Guardar resultados
          this.plazasFiltradasLocal = resultados;

          // Grupo 1.2: Mostrar cantidad
          if (resultados.length === 0) {
            this.toastService.show(
              'No se encontraron resultados',
              'info'
            );
          }
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
        }
      });
  }

  recargar(): void {
    this.searchControl.reset();
    this.filtroTipologia.reset();
    this.cargarPlazas();
  }

  limpiarCache(): void {
    this.plazasService.limpiarCache();
    this.recargar();
    this.toastService.show('Cache limpiado', 'info');
  }
}
```

### Template

```html
<!-- src/features/plazas/pages/plazas-list/plazas-list.component.html -->

<div class="p-4 bg-surface-50 rounded-lg">

  <!-- Grupo 1: Encabezado -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-2">Plazas Sanitarias MSP</h1>
    <p class="text-muted-color">Establecimientos de salud con plazas disponibles</p>
  </div>

  <!-- Grupo 2: Controles de búsqueda y filtro -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

    <!-- Búsqueda -->
    <div>
      <label class="block text-sm font-medium mb-2">Buscar</label>
      <input
        type="text"
        pInputText
        [formControl]="searchControl"
        placeholder="Nombre, provincia, canton..."
        class="w-full"
      />
    </div>

    <!-- Filtro por tipología -->
    <div>
      <label class="block text-sm font-medium mb-2">Tipología</label>
      <p-dropdown
        [options]="tipologiasDisponibles"
        [formControl]="filtroTipologia"
        placeholder="Seleccionar..."
        [showClear]="true"
        class="w-full"
      ></p-dropdown>
    </div>

    <!-- Botones de acción -->
    <div class="flex items-end gap-2">
      <button
        pButton
        label="Recargar"
        icon="pi pi-refresh"
        (click)="recargar()"
        [outlined]="true"
        class="w-full"
      ></button>
      <button
        pButton
        label="Limpiar"
        icon="pi pi-trash"
        (click)="limpiarCache()"
        severity="danger"
        [text]="true"
      ></button>
    </div>
  </div>

  <!-- Grupo 3: Estado de carga -->
  @if (cargando$ | async) {
    <div class="text-center py-8">
      <p class="text-muted-color">Cargando establecimientos...</p>
    </div>
  }

  <!-- Grupo 4: Tabla de datos -->
  @if (!(cargando$ | async)) {
    <p-table
      [value]="plazasFiltradasLocal"
      [rows]="20"
      [paginator]="true"
      responsiveLayout="scroll"
      [globalFilterFields]="['establecimiento', 'provincia']"
      styleClass="p-datatable-striped"
    >
      <ng-template pTemplate="header">
        <tr>
          <th>Establecimiento</th>
          <th>Tipología</th>
          <th>Provincia</th>
          <th>Canton</th>
          <th>Plazas</th>
          <th>Coordenadas</th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-plaza>
        <tr>
          <td>{{ plaza.establecimiento }}</td>
          <td>
            <span
              [ngClass]="'p-2 rounded text-white'"
              [style.backgroundColor]="getTipologiaColor(plaza.tipologia)"
            >
              {{ plaza.tipologia }}
            </span>
          </td>
          <td>{{ plaza.provincia }}</td>
          <td>{{ plaza.canton }}</td>
          <td class="font-bold">{{ plaza.numeroDePlazas }}</td>
          <td>
            @if (plaza.tieneUbicacion) {
              <span class="text-green-600">
                ✓ {{ plaza.lat }}, {{ plaza.long }}
              </span>
            } @else {
              <span class="text-yellow-600">Sin ubicación</span>
            }
          </td>
        </tr>
      </ng-template>

      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="6" class="text-center py-4">
            No hay plazas que mostrar
          </td>
        </tr>
      </ng-template>
    </p-table>
  }
</div>
```

---

## Ventajas de la Estructura

✅ **Separación de responsabilidades**: Service maneja datos, componente UI
✅ **Observable patterns**: Implementa async pipe y takeUntil
✅ **Caching**: Reduce cargas innecesarias al servidor
✅ **Búsqueda eficiente**: Debounce evita múltiples requests
✅ **Filtrado flexible**: Múltiples criterios sin recargar datos
✅ **Tipado fuerte**: TypeScript asegura seguridad de tipos
✅ **Error handling**: Manejo centralizado con toast notifications

---

## Próximos Pasos

1. Implementar mapas interactivos (Leaflet/Mapbox)
2. Cálculo de distancias a ubicación del usuario
3. Exportación a formatos adicionales (JSON, GeoJSON)
4. Integración con servicios de geocoding reverso
5. Análisis geoespacial avanzado

