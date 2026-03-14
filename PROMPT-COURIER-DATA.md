# Prompt: Añadir data real de couriers a la página /couriers/:provider

El dashboard ya tiene implementado: sidebar, rutas, API client (axios + React Query), páginas de tenants, simulador, envíos.
Ahora necesito expandir la página `/couriers/:provider` para mostrar la data real de cada courier directamente desde la API, sin depender de la configuración de ningún tenant.

## Hooks nuevos en src/hooks/

```ts
// Data real del courier (sin tenant)
useCourierConfig(provider) → GET /courier/:provider/config
useCourierDepartments(provider) → GET /geography/courier/:provider/departments
useCourierProvinces(provider, dept) → GET /geography/courier/:provider/departments/:dept/provinces
useCourierAgencies(provider, dept, province?) → GET /geography/courier/:provider/departments/:dept/agencies?province=
useCourierAgencySearch(provider, query) → GET /geography/courier/:provider/agencies/search?q=
useSyncAgencies(provider) → POST /geography/admin/agencies/sync/:provider (mutation)
useCourierQuote(provider) → POST /courier/:provider/quote (mutation)
```

## Tipos nuevos en src/types/courier.ts

```ts
interface CourierConfig {
  provider: string;
  name: string;
  defaultOrigin: string;
  defaultOriginLabel: string;
  originInfo: {
    agencyName?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    department?: string;
    province?: string;
    schedule?: string;
  };
  originSteps: { label: string; endpoint: string; valueField: string }[];
  destinationSteps: { label: string; endpoint: string; valueField: string }[];
  buildOrigin: string;
  buildDestination: string;
}

interface CourierAgency {
  id: string;
  provider: string;
  externalId: string;
  name: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  isActive: boolean;
  pointType: string | null;
  metadata: Record<string, any>;
  locationCode: string | null;
}

interface CourierDepartment {
  name: string;
}

interface CourierProvince {
  name: string;
}

interface QuoteRequest {
  origin: string;
  destination: string;
  weight: number;
  merchandiseType?: "sobre" | "paquete" | "otra_medida";
  packageSize?: "XXS" | "XS" | "S" | "M" | "L";
  length?: number;
  width?: number;
  height?: number;
}

interface QuoteResponse {
  provider: string;
  origin: string;
  destination: string;
  services: {
    serviceType: string;
    price: number;
    currency: string;
    transitDays: number | null;
    pricePerKilo: number | null;
    pricePerVolume: number | null;
  }[];
  scrapedAt: string;
}
```

## Página /couriers/:provider — Expandir con data real

Reorganizar la página en Tabs:

### Tab "Información"
Lo que ya existe: card con info del courier, badge de status, formato origin/destination.
Agregar:
- Datos desde `GET /courier/:provider/config`:
  - Origen por defecto: `defaultOrigin` + `defaultOriginLabel`
  - Info del origen: dirección, coordenadas, horario (desde `originInfo`)
  - Pasos para armar origin: mostrar `originSteps` como stepper visual
  - Pasos para armar destination: mostrar `destinationSteps` como stepper visual
  - Formato de build: `buildOrigin` y `buildDestination`

### Tab "Agencias" (data real del courier)
Vista jerárquica de todas las agencias del courier:

1. **Barra superior**:
   - Input de búsqueda → `GET /geography/courier/:provider/agencies/search?q=`
   - Botón "Sincronizar agencias" con icono RefreshCw → `POST /geography/admin/agencies/sync/:provider`
     - Loading spinner mientras sincroniza
     - Toast con resultado (X agencias creadas/actualizadas)
     - Dialog de confirmación antes de ejecutar

2. **Filtros jerárquicos** (3 selects en fila):
   - Select "Departamento" → `GET /geography/courier/:provider/departments`
   - Select "Provincia" (habilitado al seleccionar depto) → `GET /geography/courier/:provider/departments/:dept/provinces`
   - Botón "Limpiar filtros"

3. **Tabla de agencias** → `GET /geography/courier/:provider/departments/:dept/agencies?province=`
   - Columnas:
     - Nombre (name)
     - Dirección (address)
     - Departamento (desde metadata: departamento o department)
     - Provincia (desde metadata: provincia o province)
     - Tipo de punto (pointType) — Badge
     - Estado (isActive) — Badge verde/rojo
   - Click en fila → Sheet lateral con detalle completo:
     - Todos los campos de metadata
     - Mapa placeholder (lat/lng si disponible)
     - CourierCode que se usaría para cotizar

4. **Estadísticas en cards pequeñas** (encima de la tabla):
   - Total de agencias activas
   - Total de departamentos con cobertura
   - Total de provincias con cobertura

**Metadata específica por courier** (mostrar los campos correctos según provider):
```
Shalom: departamento, provincia, zona, horario, isOrigin, isDestination
Olva:   department, province, ubigeo, tipo (store|agent), horario
Scharff: departamento, provincia, ubigeo, horario, distritoId
Urbano: zone, departamento, distrito, horario, services, photoUrl
```

### Tab "Tipos de Mercadería"
Info de los tipos de mercadería que acepta cada courier (data estática en el frontend):

```ts
const MERCHANDISE_INFO: Record<string, { types: MerchandiseType[] }> = {
  shalom: {
    types: [
      {
        value: "sobre",
        label: "Sobre",
        description: "Tarifa plana S/8 por peso, no requiere dimensiones",
        requiresDimensions: false,
        packageSizes: null,
      },
      {
        value: "paquete",
        label: "Paquete",
        description: "5 tallas predefinidas, precio fijo por talla y ruta",
        requiresDimensions: false,
        packageSizes: ["XXS", "XS", "S", "M", "L"],
      },
      {
        value: "otra_medida",
        label: "Otra Medida",
        description: "Medidas custom (largo, ancho, alto). Usa max(peso_real, peso_volumétrico). Factor: L×A×H / 5000",
        requiresDimensions: true,
        packageSizes: null,
      },
    ],
  },
  olva: {
    types: [
      {
        value: "sobre",
        label: "Sobre",
        description: "Solo peso, sin dimensiones",
        requiresDimensions: false,
        packageSizes: null,
      },
      {
        value: "paquete",
        label: "Paquete",
        description: "Peso + dimensiones obligatorias (largo, ancho, alto en cm)",
        requiresDimensions: true,
        packageSizes: null,
      },
    ],
  },
  urbano: {
    types: [
      {
        value: "paquete",
        label: "Paquete",
        description: "Cobra por medida lineal (alto + largo + ancho), NO por peso. Tallas: XXS (≤55cm), XS (≤64), S (≤87), M (≤110), L (≤139), XL (≤159), XXL-4XL",
        requiresDimensions: true,
        packageSizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"],
      },
    ],
  },
  scharff: {
    types: [
      {
        value: "paquete",
        label: "Paquete",
        description: "Tallas auto-detectadas por dimensiones. Dimensiones opcionales.",
        requiresDimensions: false,
        packageSizes: ["SBR", "XXS", "XS", "S", "M", "L", "XL", "XXL"],
      },
    ],
  },
};
```

Mostrar como cards por cada tipo:
- Nombre y descripción
- Badge "Requiere dimensiones" si aplica
- Lista de tallas disponibles (si packageSizes)
- Este tab es solo informativo, no editable

### Tab "Test Rápido" (lo que ya existe, mejorar)
Formulario para cotizar directo con el courier:
- Campos dinámicos según el courier:
  - **origin**: Select cascading (depto → provincia → agencia/distrito) usando los endpoints de geografía del courier, O input de texto libre
  - **destination**: Igual que origin
  - **weight**: Input numérico (kg)
  - **merchandiseType**: Select con las opciones del courier (desde MERCHANDISE_INFO)
  - **packageSize**: Select (solo si el tipo de mercadería tiene tallas)
  - **length, width, height**: Inputs (solo si requiresDimensions es true)
- Botón "Cotizar" → `POST /courier/:provider/quote`
- Resultado en cards:
  - serviceType, price, currency
  - transitDays (si disponible)
  - pricePerKilo, pricePerVolume (si disponible)
  - Badge "Cache" vs "Scraping en vivo" (según el campo source de la respuesta)

## Endpoints de la API usados (referencia)

```
GET  /courier/:provider/config
→ { provider, name, defaultOrigin, defaultOriginLabel, originInfo, originSteps, destinationSteps, buildOrigin, buildDestination }

GET  /geography/courier/:provider/departments
→ [{ name }]

GET  /geography/courier/:provider/departments/:dept/provinces
→ [{ name }]

GET  /geography/courier/:provider/departments/:dept/agencies?province=
→ CourierAgency[]

GET  /geography/courier/:provider/agencies/search?q=
→ CourierAgency[] (max 30)

POST /geography/admin/agencies/sync/:provider
→ { message, created, updated } (sincroniza agencias desde la web del courier)

POST /courier/:provider/quote
→ QuoteResponse { provider, origin, destination, services[], scrapedAt }
```

## Notas
- Usar los componentes shadcn/ui existentes: Card, Table, Tabs, Select, Input, Button, Badge, Sheet, Dialog, Skeleton, Sonner (toast)
- Loading con Skeleton mientras carga la data
- Los selects de departamento/provincia se cargan dinámicamente (provincia depende de departamento)
- La metadata de cada courier tiene campos diferentes — renderizar dinámicamente según el provider
- El botón de sync es una operación lenta (Shalom usa Playwright scraping, puede tardar 30-60s) — mostrar loading y no bloquear la UI