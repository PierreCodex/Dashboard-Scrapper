# Prompt: Añadir módulos de administración al Dashboard

Necesito añadir módulos de administración a mi dashboard existente en F:\PERSONAL_JEAN\Dashboard-Scapperv1.
Es un proyecto React + Vite + TypeScript + shadcn/ui + React Router v7 + Tailwind CSS v4.
Ya tiene sidebar (app-sidebar.tsx), layout (base-layout), rutas lazy en config/routes.tsx, y 39 componentes shadcn/ui.
NO tiene API client ni React Query configurado — todo es data estática.

## Paso 0: Setup base

1. Instalar dependencias:
   - @tanstack/react-query (data fetching + cache)
   - axios (HTTP client)

2. Crear API client en src/lib/api.ts:
   - Axios instance con baseURL desde VITE_API_URL (default: http://localhost:3000/api/v1)
   - Interceptor para manejo de errores global

3. Configurar QueryClientProvider en App.tsx

4. Crear tipos en src/types/logistics.ts con las interfaces de la API:
   - Tenant, TenantCourierConfig, TenantLocation, CourierAgency
   - ShippingRequest, ShippingResponse, ShippingOption, ShippingBreakdown
   - Shipment, CreateShipment

5. Crear hooks reutilizables en src/hooks/:
   - useTenantConfig(slug) → GET /logistics/tenants/:slug/config
   - useUpdateCourierConfig(slug, provider) → PUT /logistics/tenants/:slug/config/:provider
   - useTenantLocations(slug) → GET /logistics/tenants/:slug/locations
   - useLocationAgencies(slug, location, provider) → GET /logistics/tenants/:slug/locations/:location/agencies?provider=
   - useCalculateShipping() → POST /logistics/shipping/calculate
   - useShipmentByOrder(orderId) → GET /logistics/shipments/order/:orderId

## Paso 1: Reestructurar sidebar

Reemplazar la navegación actual del sidebar (app-sidebar.tsx) con esta estructura:

```
Scrapper Admin (logo + nombre)
├── Dashboard (icono: LayoutDashboard)
│   └── /dashboard → Overview general
├── Couriers (icono: Truck)
│   ├── Shalom → /couriers/shalom
│   ├── Olva → /couriers/olva
│   ├── Urbano → /couriers/urbano
│   └── Scharff → /couriers/scharff
├── Tenants (icono: Building2)
│   ├── Lyrium → /tenants/lyrium
│   └── (futuro: más tenants)
├── Simulador (icono: Calculator)
│   └── /simulate → Cotización de prueba
├── Envíos (icono: Package)
│   └── /shipments → Buscar/listar envíos
└── Settings (icono: Settings)
    └── /settings → Config general
```

Eliminar las páginas de demo que no se usan: Mail, Chat, Calendar, Tasks, Users, FAQs, Pricing, Landing, todas las auth pages. Mantener solo: Dashboard, Error pages, Settings/Appearance.

## Paso 2: Páginas nuevas

### /dashboard — Overview
Card grid con métricas en tiempo real (usar Recharts que ya está instalado):
- Card "Couriers Activos": cantidad de couriers con isActive=true
- Card "Ciudades Mapeadas": total de locations del tenant
- Card "Cotizaciones Hoy": placeholder (futuro)
- Card "Envíos Pendientes": placeholder (futuro)
- Tabla resumen: cada courier con su status (activo/inactivo), margen actual, prioridad

### /couriers/:provider — Detalle de Courier
Página dinámica por provider (shalom, olva, urbano, scharff). Muestra:
- Card con info del courier:
  - Nombre, formato de origin/destination
  - Badge "Implementado" / "Placeholder" según status
- Sección "Configuración en Tenants": tabla con qué tenants usan este courier
  - Columnas: Tenant, Margen%, Activo, Prioridad, Tipo Mercadería, Origen
- Sección "Test Rápido": formulario mini para cotizar directo con el courier
  - Campos: origin, destination, weight, length, width, height
  - Botón "Cotizar" → POST /courier/:provider/quote
  - Resultado en card

Info estática por courier (mostrar en la página):
```
shalom:  { name: "Shalom", format: "Nombre de agencia", example: "MALVINAS - JR. RICARDO TRENEMAN", status: "implemented" }
olva:    { name: "Olva", format: "Ubigeo INEI (depto/prov/dist)", example: "15/1501/150101", status: "implemented" }
urbano:  { name: "Urbano", format: "DEPTO - PROV - DIST", example: "LIMA - LIMA - LIMA", status: "implemented" }
scharff: { name: "Scharff", format: "Depto - Prov - Distrito", example: "Lima - Lima - Lima", status: "implemented" }
```

### /tenants/:slug — Configuración del Tenant
Página principal para gestionar un tenant. Tabs:

**Tab "Config Couriers"**:
- Cards por cada courier configurado (shalom, olva):
  - Switch ON/OFF para isActive con confirmación Dialog
  - Input numérico editable para marginPercent (0-100) con botón guardar
  - Badge visual: "Sin margen" (rojo) si 0%, "Margen X%" (verde) si > 0
  - Select para merchandiseType: "sobre" | "paquete" | "otra_medida"
  - Input para defaultOrigin (con tooltip explicando el formato)
  - Input para priority (number)
  - Botón "Guardar cambios" → PUT /logistics/tenants/:slug/config/:provider
  - Toast de éxito/error con sonner

**Tab "Ciudades"**:
- Tabla con las 54 ciudades del tenant
  - Columnas: Ciudad, Departamento, Provincia
  - Filtro/búsqueda por texto
  - Click en fila → Sheet lateral con:
    - Tabs "Shalom" / "Olva"
    - Shalom: tabla de agencias (name, address, courierCode, badge "Default")
    - Olva: tabla de distritos (name, code, courierCode) + tabla puntos de recojo

**Tab "Envíos"**:
- Input buscar por externalOrderId
- Resultado: Card con datos del shipment (status badge, provider, costos, cliente, fecha)

### /simulate — Simulador de Cotización
Formulario completo:
- Select de tenant (por ahora solo "lyrium")
- Select de destino (ciudades del tenant, cargado dinámicamente)
- Tabla editable de items del carrito:
  - Columnas: Peso (kg), Largo (cm), Ancho (cm), Alto (cm), Cantidad
  - Botones + / - para agregar/quitar filas
  - Fila default con valores: 1kg, 20cm, 15cm, 10cm, qty 1
- Checkbox/Select opcional: agencyOverrides por courier
- Botón "Cotizar" → POST /logistics/shipping/calculate

Resultado:
- Cards comparativas por opción (ordenadas por tenantCost):
  - Provider + serviceType
  - courierCost (tachado si hay margen) → tenantCost (precio final)
  - Currency
  - Badge "Más barato" en la primera opción
- Sección "Desglose":
  - Peso real vs volumétrico vs facturable (en tabla o cards pequeñas)
  - Dimensiones de caja: largo × ancho × alto cm
  - Barra de progreso para packingEfficiency (%)
- Alert para skippedProviders con razón

### /shipments — Envíos
- Input de búsqueda por externalOrderId
- Botón buscar → GET /logistics/shipments/order/:id
- Card resultado: id, externalOrderId, provider, status (badge color), courierCost, tenantCost, deliveryMethod, customerName, fecha

## API Backend Reference

Base URL: VITE_API_URL=http://localhost:3000/api/v1

### Endpoints disponibles:

**Configuración del Tenant:**
```
GET  /logistics/tenants/:slug/config
→ Response: {
    tenant: { id, name, slug, isActive },
    configs: [{
      id, provider, isActive, priority,
      marginPercent, merchandiseType, defaultOrigin
    }]
  }

PUT  /logistics/tenants/:slug/config/:provider
→ Body (todos opcionales): {
    marginPercent?: number (0-100),
    isActive?: boolean,
    priority?: number,
    merchandiseType?: string,
    defaultOrigin?: string
  }
→ Response: config actualizado
```

**Ciudades y Agencias del Tenant:**
```
GET  /logistics/tenants/:slug/locations
→ Response: [{ name, department, province }]

GET  /logistics/tenants/:slug/locations/:locationName/agencies?provider=shalom
→ Response (Shalom): {
    provider, locationName, type: "agencies",
    defaultCourierCode,
    agencies: [{ id, name, address, latitude, longitude, courierCode, isDefault }]
  }

GET  /logistics/tenants/:slug/locations/:locationName/agencies?provider=olva
→ Response (Olva): {
    provider, locationName, type: "districts",
    defaultCourierCode,
    districts: [{ id, name, code, courierCode }],
    pickupPoints: [{ id, name, address, latitude, longitude, pointType, metadata }]
  }
```

**Cotización:**
```
POST /logistics/shipping/calculate
→ Body: {
    tenantId: "cmmn88vs50000vvm8v3hpjvcs",
    destination: "Arequipa - Arequipa",
    items: [{ weightKg, lengthCm?, widthCm?, heightCm?, quantity }],
    agencyOverrides?: { shalom?: "agency-id", olva?: "04/0401/040103" }
  }
→ Response: {
    tenantId, destination,
    options: [{
      provider, serviceType, courierCost, tenantCost, currency,
      breakdown: {
        totalWeightKg, volumetricWeightKg, chargeableWeightKg,
        boxLengthCm?, boxWidthCm?, boxHeightCm?, packingEfficiency?
      }
    }],
    skippedProviders: [{ provider, reason }],
    calculatedAt
  }
```

**Envíos:**
```
POST /logistics/shipments
→ Body: {
    externalOrderId, tenantId, destination, provider,
    serviceType?, courierCost, tenantCost,
    deliveryMethod?: "AGENCY_PICKUP"|"HOME_DELIVERY",
    pickupAgencyId?, deliveryAddress?, deliveryReference?,
    customerName, customerPhone?, customerEmail?,
    items: [{ weightKg, lengthCm?, widthCm?, heightCm?, quantity }]
  }

GET  /logistics/shipments/order/:externalOrderId
→ Response: { id, externalOrderId, tenantId, provider, serviceType, status, courierCost, tenantCost, deliveryMethod, customerName, createdAt }
```

**Cotización directa por courier (sin tenant):**
```
POST /courier/:provider/quote
→ Body: { origin, destination, weight, merchandiseType?, packageSize?, length?, width?, height? }
→ Response: { provider, services: [{ serviceType, price, currency }], source }
```

**Datos fijos:**
- Tenant slug: "lyrium"
- Tenant ID: "cmmn88vs50000vvm8v3hpjvcs"
- Couriers: shalom, olva, urbano, scharff

## Notas técnicas

- Usar los componentes shadcn/ui que ya existen en src/components/ui/ (Card, Table, Switch, Input, Select, Badge, Tabs, Button, Dialog, Sheet, Skeleton, Sonner)
- Usar Recharts (ya instalado) para gráficos del dashboard
- Loading states con Skeleton components
- Errores con toast (sonner ya instalado)
- Tema oscuro por defecto (ya configurado)
- Rutas lazy-loaded en config/routes.tsx (patrón existente del proyecto)
- React Router v7 para navegación
- NO crear autenticación, es admin interno
- Mantener la estructura de carpetas existente:
  - Páginas en src/app/
  - Componentes en src/components/
  - Hooks en src/hooks/
  - Tipos en src/types/
  - Utilidades en src/lib/