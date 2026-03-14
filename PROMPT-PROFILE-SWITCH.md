# Prompt: Autenticación + Switch de perfil Admin / Empresa

El backend ya tiene auth implementado con JWT + permisos granulares.
Necesito integrar login, permisos y switch de perfil en el dashboard.

## Endpoints de Auth (ya implementados en backend)

```
POST /auth/login
→ Body: { email, password }
→ Response: {
    accessToken: "eyJ...",
    user: { id, email, name, role, permissions[], tenantId, tenantSlug, tenantName }
  }

GET  /auth/me                    → Mi perfil + permisos (requiere JWT)
GET  /auth/permissions           → Lista de permisos disponibles (solo ADMIN)
POST /auth/users                 → Crear usuario (solo ADMIN)
GET  /auth/users                 → Listar usuarios (solo ADMIN)
PUT  /auth/users/:id/permissions → Actualizar permisos (solo ADMIN)
PATCH /auth/users/:id/toggle     → Activar/desactivar usuario (solo ADMIN)
```

**Usuarios existentes:**
- Admin: `admin@scrapper.com` / `admin123` (role: ADMIN, todos los permisos)
- Lyrium: `admin@lyrium.com` / `lyrium2024` (role: TENANT_USER, tenant: lyrium)

**Permisos disponibles:**
| Permiso | Descripción |
|---------|-------------|
| `shipping:calculate` | Cotizar envíos |
| `shipping:create` | Crear envíos |
| `shipping:read` | Consultar envíos |
| `locations:read` | Ver ciudades y agencias |
| `config:read` | Ver configuración del tenant |
| `config:write` | Editar configuración (margen, couriers) |
| `agencies:sync` | Sincronizar agencias de couriers |
| `users:manage` | Gestionar usuarios |

**Permisos default TENANT_USER:** shipping:calculate, shipping:create, shipping:read, locations:read, config:read
**ADMIN:** tiene todos los permisos implícitamente

## Implementación Frontend

### 1. Auth Context y API

Crear `src/contexts/auth-context.tsx`:
```ts
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "TENANT_USER";
  permissions: string[];
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTenantUser: boolean;
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

- Persistir `accessToken` y `user` en localStorage
- Configurar axios interceptor para agregar `Authorization: Bearer {token}` a todas las peticiones
- Si recibe 401, hacer logout automático
- Envolver la app con `<AuthProvider>` en App.tsx

### 2. Página de Login

Crear `src/app/auth/login/page.tsx`:
- Formulario: email + password
- Botón "Iniciar sesión"
- Toast de error si credenciales inválidas
- Redirigir a `/dashboard` (admin) o `/empresa/dashboard` (tenant user) tras login
- Diseño centrado, con logo del proyecto, tema oscuro

### 3. Protección de Rutas

Crear `src/components/router/protected-route.tsx`:
- Si no hay token → redirigir a `/auth/login`
- Si hay token pero el perfil no tiene el permiso requerido → mostrar página 403
- Cada ruta puede declarar permisos requeridos

Crear `src/components/router/permission-gate.tsx`:
- Componente wrapper que oculta su children si el usuario no tiene el permiso
- Uso: `<PermissionGate permission="agencies:sync"><SyncButton /></PermissionGate>`

### 4. Sidebar dinámico según rol y permisos

**Si role=ADMIN:**
```
Scrapper Admin
├── Dashboard → /dashboard
├── Couriers → /couriers/shalom, /olva, /urbano, /scharff
├── Tenants → /tenants/lyrium
├── Simulador → /simulate
├── Envíos → /shipments
├── Usuarios → /users (si tiene users:manage)
└── Settings
```

**Si role=TENANT_USER:**
```
{tenantName} (ej: Lyrium)
├── Dashboard → /empresa/dashboard
├── Cotizar Envío → /empresa/cotizar (si tiene shipping:calculate)
├── Mis Envíos → /empresa/envios (si tiene shipping:read)
├── Mis Ciudades → /empresa/ciudades (si tiene locations:read)
├── Mis Couriers → /empresa/couriers (si tiene config:read)
│   └── Dentro: botón "Sincronizar" solo visible si tiene agencies:sync
└── Mi Configuración → /empresa/config (si tiene config:read, editable si config:write)
```

Las opciones del sidebar se filtran dinámicamente según `hasPermission()`.

### 5. Página de Gestión de Usuarios (solo ADMIN)

Crear `src/app/users/page.tsx`:

**Tabla de usuarios:**
- Columnas: Nombre, Email, Rol (badge), Tenant, Estado (badge activo/inactivo), Permisos (badges), Fecha
- Datos desde GET /auth/users

**Acciones por usuario:**
- Switch para activar/desactivar → PATCH /auth/users/:id/toggle
- Botón "Editar permisos" → abre Dialog con:
  - Checklist de todos los permisos disponibles (desde GET /auth/permissions)
  - Cada permiso con Switch ON/OFF
  - Botón "Guardar" → PUT /auth/users/:id/permissions
  - Toast de confirmación

**Botón "Crear usuario"** → Dialog con:
- Input email
- Input password
- Input nombre
- Select rol: ADMIN / TENANT_USER
- Select tenant (solo si rol = TENANT_USER, opciones desde los tenants existentes)
- Botón crear → POST /auth/users
- Toast de confirmación

### 6. Páginas de Empresa (TENANT_USER)

Crear en `src/app/empresa/`:

#### /empresa/dashboard
- Cards con métricas del tenant (couriers activos, ciudades, etc.)
- Solo lectura

#### /empresa/cotizar (permiso: shipping:calculate)
- Igual que /simulate pero:
  - Tenant fijo (el del usuario logueado)
  - NO muestra courierCost, solo tenantCost

#### /empresa/envios (permiso: shipping:read)
- Buscar envíos por externalOrderId
- Solo muestra tenantCost, no courierCost

#### /empresa/ciudades (permiso: locations:read)
- Tabla de ciudades del tenant
- Click → ver agencias disponibles por courier

#### /empresa/couriers (permiso: config:read)
- Cards de couriers configurados (solo lectura)
- Botón "Sincronizar" solo si tiene permiso agencies:sync
  - Usa `<PermissionGate permission="agencies:sync">`

#### /empresa/config (permiso: config:read)
- Ver configuración del tenant
- Si tiene config:write → puede editar margen, prioridad, etc.
- Si solo config:read → todo deshabilitado/readonly

### 7. Rutas en config/routes.tsx

```ts
// Pública
{ path: "/auth/login", component: LoginPage }

// Admin
{ path: "/dashboard", component: Dashboard, permissions: [] }
{ path: "/couriers/:provider", component: CourierPage, roles: ["ADMIN"] }
{ path: "/tenants/:slug", component: TenantPage, roles: ["ADMIN"] }
{ path: "/simulate", component: SimulatePage, roles: ["ADMIN"] }
{ path: "/shipments", component: ShipmentsPage, roles: ["ADMIN"] }
{ path: "/users", component: UsersPage, permissions: ["users:manage"] }

// Empresa (TENANT_USER)
{ path: "/empresa/dashboard", component: EmpresaDashboard, roles: ["TENANT_USER"] }
{ path: "/empresa/cotizar", component: EmpresaCotizar, permissions: ["shipping:calculate"] }
{ path: "/empresa/envios", component: EmpresaEnvios, permissions: ["shipping:read"] }
{ path: "/empresa/ciudades", component: EmpresaCiudades, permissions: ["locations:read"] }
{ path: "/empresa/couriers", component: EmpresaCouriers, permissions: ["config:read"] }
{ path: "/empresa/config", component: EmpresaConfig, permissions: ["config:read"] }
```

### 8. Lógica de axios

En `src/lib/api.ts` actualizar:
```ts
// Interceptor de request: agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de response: logout en 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);
```

## Notas técnicas
- El JWT expira en 7 días
- ADMIN tiene todos los permisos implícitamente (no se verifica la lista)
- Los permisos se verifican en el backend Y en el frontend (doble capa)
- Frontend: ocultar botones/opciones sin permiso. Backend: retornar 403 si intenta acceder
- No implementar registro público — solo ADMIN puede crear usuarios
- Usar sonner para toasts de login/error/permisos
- Mantener componentes shadcn/ui existentes