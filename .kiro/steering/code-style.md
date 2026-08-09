# Angular Code Style Guide - VelvetRooms

## Principios Fundamentales

- **Single Responsibility Principle (SRP)**: Cada archivo no debe exceder 300 líneas
- **Modularidad**: Separar por features, cada una independiente y reutilizable
- **Claridad**: Nombres descriptivos y autoexplicativos
- **Consistencia**: Seguir los mismos patrones en toda la aplicación

---

## Estructura del Proyecto

```
src/
└── app/
    ├── core/                    # Servicios, guards e interceptores globales
    │   ├── services/
    │   ├── guards/
    │   ├── interceptors/
    │   ├── models/
    │   └── constants/
    ├── shared/                  # Componentes, pipes, directivas y utilidades reutilizables
    │   ├── components/
    │   ├── pipes/
    │   ├── directives/
    │   ├── utils/
    │   └── ui/
    ├── features/                # Features específicas de la aplicación
    │   ├── home/
    │   │   ├── pages/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── interfaces/
    │   │   └── home.routes.ts
    │   ├── profile/
    │   │   ├── pages/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── interfaces/
    │   │   └── profile.routes.ts
    │   └── chat/
    │       ├── pages/
    │       ├── components/
    │       ├── services/
    │       ├── interfaces/
    │       └── chat.routes.ts
    ├── app.component.ts
    ├── app.routes.ts
    └── app.config.ts
```

---

## Agrupación de Código

Organiza el código en **grupos lógicos** separados por espacios en blanco. Agrupa operaciones relacionadas y separa grupos distintos con una línea vacía.

### Patrón de Agrupación

```typescript
// Grupo 1: Operaciones externas / API calls
this.userService.login(credentials)
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: (response) => {

      // Grupo 2: Almacenamiento
      localStorage.setItem('auth_token', response.token);
      sessionStorage.setItem('user_id', response.user.id);

      // Grupo 3: Estado interno
      this.tokenSubject.next(response.token);
      this.currentUserSubject.next(response.user);
      this.isAuthenticatedSubject.next(true);

      // Grupo 4: Retorno / Resultado
      return response;
    }
  });
```

### Ejemplo en Servicio

```typescript
login(credentials: ILoginRequest): Observable<ILoginResponse> {
  return this.http.post<ILoginResponse>('/api/auth/login', credentials)
    .pipe(
      map(response => {

        // Grupo 1: Almacenamiento persistente
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_email', response.user.email);

        // Grupo 2: Actualizar estado
        this.tokenSubject.next(response.token);
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);

        // Grupo 3: Retorno
        return response;
      })
    );
}
```

### Grupos Comunes

| Grupo | Descripción | Ejemplo |
|-------|-----------|---------|
| 1. Operaciones externas | API calls, servicios externos | `this.http.get()`, `this.service.fetch()` |
| 2. Almacenamiento | localStorage, sessionStorage, cookies | `localStorage.setItem()` |
| 3. Estado interno | BehaviorSubject, variables de clase | `this.userSubject.next()` |
| 4. Lógica local | Cálculos, transformaciones | `const processed = transform(data)` |
| 5. Retorno / Resultado | return, resolve, emit | `return data` |

### En Componentes

```typescript
ngOnInit(): void {

  // Grupo 1: Cargar datos
  this.loadUserData();

  // Grupo 2: Suscripciones
  this.userService.currentUser$
    .pipe(takeUntil(this.destroy$))
    .subscribe(user => this.currentUser = user);

  this.userService.isLoading$
    .pipe(takeUntil(this.destroy$))
    .subscribe(loading => this.isLoading = loading);
}

onSubmit(): void {

  // Grupo 1: Validación
  if (this.form.invalid) return;

  // Grupo 2: Estado de carga
  this.isLoading = true;
  this.errorMessage = null;

  // Grupo 3: Obtener datos del formulario
  const credentials = this.form.value;

  // Grupo 4: Enviar al servicio
  this.authService.login(credentials)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
      }
    });
}
```

---

## Directivas de Plantillas de Angular (v21+)

Angular 21 introduce una nueva sintaxis de control de flujo más legible y performante. Usa estas directivas en lugar de las antiguas `*ngIf`, `*ngFor`, etc.

### @if - Condicionales

```typescript
// ❌ INCORRECTO: Sintaxis antigua
<div *ngIf="isLoading">Cargando...</div>

// ✅ CORRECTO: Nueva sintaxis
@if (isLoading) {
  <div>Cargando...</div>
}

// Con else
@if (user) {
  <p>Bienvenido {{ user.name }}</p>
} @else {
  <p>No hay usuario</p>
}

// Con else if
@if (error) {
  <div class="error">{{ error }}</div>
} @else if (isLoading) {
  <div class="loading">Cargando...</div>
} @else {
  <div class="success">Completado</div>
}
```

### @for - Iteraciones

```typescript
// ❌ INCORRECTO: Sintaxis antigua
<div *ngFor="let item of items; let i = index">
  {{ i }}: {{ item.name }}
</div>

// ✅ CORRECTO: Nueva sintaxis
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}

// Con índice
@for (item of items; track item.id; let i = $index) {
  <div>{{ i }}: {{ item.name }}</div>
}

// Con first/last
@for (item of items; track item.id; let first = $first; let last = $last) {
  <div [class.border-b]="!last">{{ item.name }}</div>
}
```

### @switch/@case - Selección múltiple

```typescript
// ❌ INCORRECTO: Sintaxis antigua
<div [ngSwitch]="status">
  <div *ngSwitchCase="'pending'">Pendiente</div>
  <div *ngSwitchCase="'approved'">Aprobado</div>
  <div *ngSwitchDefault>Desconocido</div>
</div>

// ✅ CORRECTO: Nueva sintaxis
@switch (status) {
  @case ('pending') {
    <div>Pendiente</div>
  }
  @case ('approved') {
    <div>Aprobado</div>
  }
  @default {
    <div>Desconocido</div>
  }
}
```

### Combinando @if con @switch para Validación

```typescript
// Validar errores de formulario
@if (email?.invalid && email?.touched) {
  @switch (true) {
    @case (email?.errors?.['required']) {
      <p class="error">Email requerido</p>
    }
    @case (email?.errors?.['email']) {
      <p class="error">Email inválido</p>
    }
    @case (email?.errors?.['emailTaken']) {
      <p class="error">Email ya registrado</p>
    }
  }
}
```

### Atributo track en @for

El atributo `track` es **obligatorio** y mejora el performance:

```typescript
// ✅ CORRECTO: Con track
@for (user of users; track user.id) {
  <div>{{ user.name }}</div>
}

// ✅ TAMBIÉN CORRECTO: Con índice
@for (item of items; track $index) {
  <div>{{ item }}</div>
}

// ❌ INCORRECTO: Sin track
@for (user of users) {
  <div>{{ user.name }}</div>
}
```

### Comparación de Sintaxis

| Caso | Angular <v21 | Angular v21+ |
|------|-------------|------------|
| Condicional | `*ngIf="condition"` | `@if (condition) { }` |
| Else | `*ngIf="...; else block"` | `@if (...) { } @else { }` |
| Loop | `*ngFor="let item of items"` | `@for (item of items; track item.id)` |
| Switch | `[ngSwitch]="value"` | `@switch (value) { }` |
| Case | `*ngSwitchCase="'value'"` | `@case ('value') { }` |

---

## Convenciones de Nombres

### Archivos y Carpetas

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes | `component-name.component.ts` | `user-card.component.ts` |
| Servicios | `service-name.service.ts` | `auth.service.ts` |
| Guards | `guard-name.guard.ts` | `auth.guard.ts` |
| Interceptores | `interceptor-name.interceptor.ts` | `error.interceptor.ts` |
| Pipes | `pipe-name.pipe.ts` | `safe-html.pipe.ts` |
| Directivas | `directive-name.directive.ts` | `highlight.directive.ts` |
| Interfaces | `model-name.ts` | `user.ts` |
| Carpetas | `kebab-case` | `user-profile`, `chat-messages` |

### Clases y Variables

```typescript
// Clases: PascalCase
export class UserService { }
export class AuthGuard { }

// Variables y funciones: camelCase
const userData: User;
function getUserById(id: number): User { }

// Constantes: UPPER_SNAKE_CASE
export const API_BASE_URL = 'https://api.example.com';
export const MAX_RETRIES = 3;

// Interfaces: PascalCase con prefijo I (opcional)
export interface IUser { }
export interface User { }
```

---

## Estructura de Componentes

### Componente Básico (máx. 300 líneas)

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UserService } from '../services/user.service';
import { IUser } from '../interfaces/user';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.css']
})
export class UserCardComponent implements OnInit, OnDestroy {

  // Propiedades públicas
  user: IUser | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  // Propiedades privadas
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUser(): void {

    // Grupo 1: Establecer estado de carga
    this.isLoading = true;

    // Grupo 2: Obtener usuario del servicio
    this.userService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Error loading user';
          this.isLoading = false;
          console.error('Error:', error);
        },
        complete: () => {
          console.log('Usuario cargado exitosamente');
        }
      });
  }
}
```

---

## Servicios

### Patrón de Servicio (máx. 300 líneas)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { API_BASE_URL } from '../../core/constants/api.constants';
import { IUser } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<IUser> {
    return this.http.get<IUser>(`${API_BASE_URL}/users/me`);
  }

  getUserById(id: string): Observable<IUser> {
    return this.http.get<IUser>(`${API_BASE_URL}/users/${id}`);
  }

  updateUser(user: IUser): Observable<IUser> {
    return this.http.put<IUser>(`${API_BASE_URL}/users/${user.id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/users/${id}`);
  }

  setCurrentUser(user: IUser | null): void {
    this.currentUserSubject.next(user);
  }
}
```

---

## Interfaces y Modelos

```typescript
// user.ts
export interface IUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse {
  data: IUser;
  status: 'success' | 'error';
}
```

---

## Guards

### Patrón de Guard

```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
```

---

## Interceptores

### Patrón de Interceptor (máx. 300 líneas)

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}
```

---

## Rutas (Feature Routing)

### home.routes.ts

```typescript
import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    component: HomePageComponent
  }
];
```

### app.routes.ts

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
  },
  {
    path: 'chat',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/chat/chat.routes').then(m => m.CHAT_ROUTES)
  }
];
```

---

## Mejores Prácticas

### ✅ Observable y Async Pipe

```typescript
// ✅ CORRECTO: Usar async pipe y OnPush strategy
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  users$ = this.userService.getUsers();

  constructor(private userService: UserService) {}
}
```

```html
<!-- Template -->
<div *ngFor="let user of users$ | async">
  {{ user.name }}
</div>
```

### ✅ Manejo de Suscripciones

```typescript
// ✅ CORRECTO: Usar takeUntil para desuscribirse
private destroy$ = new Subject<void>();

ngOnInit(): void {

  // Grupo 1: Obtener datos del servicio
  this.userService.getUsers()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar usuarios';
        this.isLoading = false;
        console.error('Error:', error);
      },
      complete: () => {
        console.log('Carga de usuarios completada');
      }
    });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

#### Ejemplo Completo en Componente

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UserService } from '../services/user.service';
import { IUser } from '../interfaces/user';

@Component({
  selector: 'app-user-list',
  standalone: true,
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit, OnDestroy {

  users: IUser[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(): void {

    // Grupo 1: Establecer estado inicial
    this.isLoading = true;
    this.errorMessage = null;

    // Grupo 2: Obtener usuarios del servicio
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'No se pudieron cargar los usuarios';
          this.isLoading = false;
          console.error('Error en getUsers:', error);
        },
        complete: () => {
          console.log('Observable de usuarios completado');
        }
      });
  }

  refreshUsers(): void {
    this.loadUsers();
  }
}
```

#### Patrones Avanzados con Múltiples Suscripciones

```typescript
// ✅ CORRECTO: Múltiples observables con takeUntil
ngOnInit(): void {

  // Suscripción 1
  this.userService.getCurrentUser()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user) => this.currentUser = user,
      error: (error) => console.error('Error usuario:', error),
      complete: () => console.log('Datos usuario cargados')
    });

  // Suscripción 2
  this.userService.getNotifications()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (notifications) => this.notifications = notifications,
      error: (error) => console.error('Error notificaciones:', error),
      complete: () => console.log('Notificaciones cargadas')
    });
}
```

#### Con combineLatest o forkJoin

```typescript
// ✅ CORRECTO: Combinar múltiples observables
import { combineLatest, forkJoin } from 'rxjs';

ngOnInit(): void {

  // Grupo 1: Combinar observables
  combineLatest([
    this.userService.getCurrentUser(),
    this.userService.getSettings()
  ])
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([user, settings]) => {
        this.user = user;
        this.settings = settings;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar datos';
        console.error('Error en combineLatest:', error);
      },
      complete: () => {
        console.log('Todos los datos cargados');
      }
    });
}
```

### ❌ Evitar

```typescript
// ❌ INCORRECTO: Suscripciones sin desuscribirse
this.userService.getUsers().subscribe(users => this.users = users);

// ❌ INCORRECTO: Lógica compleja en templates
{{ (user.birthDate | date: 'yyyy-MM-dd') | uppercase }}

// ❌ INCORRECTO: Componentes mayores a 300 líneas
```

---

## Convenciones CSS/Styling

### Nombrado de Clases

```css
/* Usar BEM (Block Element Modifier) */
.user-card { }
.user-card__header { }
.user-card__title { }
.user-card--active { }
.user-card--disabled { }
```

### Estructura de Estilos

```css
/* Mantener estilos cercanos al componente */
/* user-card.component.css */

:host {
  display: block;
}

.card {
  padding: 1rem;
  border: 1px solid #e0e0e0;
}

.card__header {
  margin-bottom: 1rem;
}
```

---

## Manejo de Errores con Toast Notifications

Todos los errores en las suscripciones deben mostrar un Toast notification con severity `danger` para feedback visual al usuario.

### Patrón de Error Handling con Toast

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  templateUrl: './signup-page.component.html'
})
export class SignupPageComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  constructor(private signupService: SignupService, private toastService: ToastService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {

    // Grupo 1: Validación
    if (this.signupForm.invalid) {
      return;
    }

    // Grupo 2: Estado de carga
    this.isLoading = true;
    this.errorMessage = null;

    // Grupo 3: Enviar datos al servicio
    this.signupService.signup(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {

          // Grupo 1: Actualizar estado en caso de éxito
          this.isLoading = false;
          this.showSuccessMessage = true;

          // Grupo 2: Mostrar toast de éxito (opcional)
          this.toastService.show('¡Registro exitoso!', 'success');
        },
        error: (error) => {

          // Grupo 1: Extraer mensaje de error
          let errorMsg = 'Error al registrarse';
          if (error?.message) {
            errorMsg = error.message;
          } else if (error?.error?.message) {
            errorMsg = error.error.message;
          } else if (typeof error === 'string') {
            errorMsg = error;
          }

          // Grupo 2: Mostrar toast con error (severity danger)
          this.toastService.show(errorMsg, 'danger');

          // Grupo 3: Actualizar estado
          this.errorMessage = errorMsg;
          this.isLoading = false;
          console.error('Signup error:', error);
        },
        complete: () => {
          console.log('Signup completado');
        }
      });
  }
}
```

### Servicio de Toast

Crea un `ToastService` centralizado en `src/core/services/toast.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private messageService: MessageService) {}

  show(message: string, severity: 'success' | 'danger' | 'warning' | 'info' = 'info'): void {

    // Grupo 1: Traducir severidad a formato PrimeNG
    const severityMap = {
      'success': 'success',
      'danger': 'error',
      'warning': 'warning',
      'info': 'info'
    };

    // Grupo 2: Mostrar toast con vida de 3 segundos
    this.messageService.add({
      severity: severityMap[severity],
      summary: this.getSummary(severity),
      detail: message,
      life: 3000,
      styleClass: 'toast-notification'
    });
  }

  private getSummary(severity: string): string {
    const summaries = {
      'success': '✓ Éxito',
      'danger': '✗ Error',
      'warning': '⚠ Advertencia',
      'info': 'ℹ Información'
    };
    return summaries[severity] || 'Notificación';
  }
}
```

### Integración en app.config.ts

Asegúrate de que `MessageService` esté provisto en la configuración:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    providePrimeNG(),
    MessageService  // ✅ Agregar MessageService
  ]
};
```

### Integración en Componente

```typescript
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,  // ✅ Agregar ToastModule
    // otros imports...
  ],
  template: `
    <p-toast></p-toast>  <!-- ✅ Agregar en template -->
    
    <!-- resto del template -->
  `
})
export class SignupPageComponent { }
```

### Severidades de Toast

| Severidad | Clase CSS | Uso |
|-----------|-----------|-----|
| `success` | `.p-toast-success` | Operaciones exitosas (registro, confirmación, etc.) |
| `danger` | `.p-toast-error` | Errores críticos, validaciones fallidas |
| `warning` | `.p-toast-warning` | Advertencias no críticas, confirmaciones |
| `info` | `.p-toast-info` | Información general |

### Checklist de Error Handling

- [ ] Todos los subscribe tienen handler `error`
- [ ] El handler `error` extrae el mensaje correctamente
- [ ] Se llama a `toastService.show()` con mensaje y severidad `danger` en errores
- [ ] Los toasts desaparecen automáticamente después de 3 segundos
- [ ] Los mensajes de error son claros y útiles para el usuario
- [ ] Se mantiene registro en `console.error()` para debugging
- [ ] Se actualiza el estado del componente correctamente

---

## Límites de Complejidad

| Tipo | Máx. Líneas | Máx. Métodos | Máx. Propiedades |
|------|------------|-------------|-----------------|
| Componente | 300 | 8 | 10 |
| Servicio | 300 | 10 | 5 |
| Guard | 150 | 2 | 2 |
| Interceptor | 150 | 1 | 1 |
| Pipe | 100 | 1 | 0 |

---

## Checklist de Revisión

- [ ] Archivo no excede 300 líneas
- [ ] Nombres descriptivos y consistentes
- [ ] SRP: Cada clase tiene una única responsabilidad
- [ ] Tipado fuerte (no usar `any`)
- [ ] Observables con `takeUntil` en OnDestroy
- [ ] Guards y Interceptores inyectados en `app.config.ts`
- [ ] Imports organizados alfabéticamente
- [ ] Estilos en archivo CSS separado
- [ ] Componentes standalone configurados
- [ ] Interfaces documentadas

---

## Referencias

- [Angular Official Style Guide](https://angular.io/guide/styleguide)
- [RxJS Best Practices](https://rxjs.dev/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)
