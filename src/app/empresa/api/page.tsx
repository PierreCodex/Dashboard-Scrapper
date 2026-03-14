import { BaseLayout } from "@/components/layouts/base-layout"
import { useApiKeys, useCreateApiKey, useRevokeApiKey, type CreateApiKeyResponse } from "@/hooks/useApiKeys"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { 
  Key, Plus, Trash2, Copy, Check, Code, Play, 
  Terminal, Box
} from "lucide-react"
import { toast } from "sonner"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

interface Endpoint {
  method: 'GET' | 'POST'
  path: string
  name: string
  description: string
  params: { name: string; type: string; required: boolean; description: string }[]
  exampleRequest: unknown
  exampleResponse: unknown
}

const ENDPOINTS: Endpoint[] = [
  // ─── Endpoints para integración pública ────────────────────────
  {
    method: 'GET',
    path: '/logistics/shipping/destinations',
    name: 'Destinos disponibles',
    description: 'Lista las ciudades y distritos configurados para tu empresa. Usa estos valores como "destination" en /shipping/calculate.',
    params: [],
    exampleRequest: {},
    exampleResponse: {
      interprovincial: [
        { name: 'Arequipa - Arequipa', department: 'Arequipa' },
        { name: 'Trujillo', department: 'La Libertad' },
      ],
      local: {
        urbano: [{ name: 'Miraflores', department: 'Lima' }],
        scharff: [{ name: 'San Isidro', department: 'Lima' }],
      },
    },
  },
  {
    method: 'GET',
    path: '/logistics/shipping/couriers',
    name: 'Couriers activos',
    description: 'Lista los couriers habilitados para tu empresa con su categoria (interprovincial/local).',
    params: [],
    exampleRequest: {},
    exampleResponse: [
      { provider: 'shalom', name: 'Shalom', category: 'interprovincial', merchandiseType: 'otra_medida' },
      { provider: 'urbano', name: 'Urbano', category: 'local', merchandiseType: 'otra_medida' },
    ],
  },
  {
    method: 'POST',
    path: '/logistics/shipping/calculate',
    name: 'Cotizar envío',
    description: 'Calcula el costo de envío con los couriers configurados. Resuelve automáticamente orígenes, destinos y márgenes de tu empresa.',
    params: [
      { name: 'destination', type: 'string', required: true, description: 'Ciudad destino (usar valores de /shipping/destinations)' },
      { name: 'items', type: 'array', required: true, description: 'Items del carrito: { weightKg, lengthCm, widthCm, heightCm, quantity }' },
      { name: 'providers', type: 'string[]', required: false, description: 'Filtrar couriers (ej: ["shalom","olva"]). Si no se envía, usa todos los activos.' },
    ],
    exampleRequest: {
      destination: 'Arequipa - Arequipa',
      items: [
        { weightKg: 1.5, lengthCm: 30, widthCm: 20, heightCm: 15, quantity: 2 },
      ],
    },
    exampleResponse: {
      tenantId: 'clxyz...',
      destination: 'Arequipa - Arequipa',
      options: [
        { provider: 'shalom', serviceType: 'Agencia', courierCost: 12.50, tenantCost: 13.13, currency: 'PEN', breakdown: { totalWeightKg: 3, volumetricWeightKg: 1.8, chargeableWeightKg: 3, boxLengthCm: 30, boxWidthCm: 20, boxHeightCm: 30 } },
        { provider: 'olva', serviceType: 'Tienda/Agente', courierCost: 15.00, tenantCost: 15.75, currency: 'PEN', breakdown: { totalWeightKg: 3, volumetricWeightKg: 1.8, chargeableWeightKg: 3 } },
      ],
      skippedProviders: [],
      calculatedAt: '2026-03-13T15:00:00.000Z',
    },
  },
  {
    method: 'POST',
    path: '/logistics/shipments',
    name: 'Crear envío',
    description: 'Registra un envío después de que el cliente elige un courier y servicio.',
    params: [
      { name: 'destination', type: 'string', required: true, description: 'Ciudad destino' },
      { name: 'selectedProvider', type: 'string', required: true, description: 'Courier elegido (ej: "shalom")' },
      { name: 'selectedServiceType', type: 'string', required: true, description: 'Tipo de servicio (ej: "Agencia")' },
      { name: 'externalOrderId', type: 'string', required: false, description: 'ID de tu orden para vincular' },
      { name: 'items', type: 'array', required: true, description: 'Items del envío' },
    ],
    exampleRequest: {
      destination: 'Arequipa - Arequipa',
      selectedProvider: 'shalom',
      selectedServiceType: 'Agencia',
      externalOrderId: 'ORD-12345',
      items: [{ weightKg: 1.5, lengthCm: 30, widthCm: 20, heightCm: 15, quantity: 1 }],
    },
    exampleResponse: {
      id: 'clxyz...',
      status: 'pending',
      externalOrderId: 'ORD-12345',
      provider: 'shalom',
      courierCost: 12.50,
      tenantCost: 13.13,
    },
  },
  {
    method: 'GET',
    path: '/logistics/shipments/order/:externalOrderId',
    name: 'Consultar envío por orden',
    description: 'Busca un envío usando el ID de orden de tu sistema (externalOrderId).',
    params: [
      { name: 'externalOrderId', type: 'string', required: true, description: 'ID de tu orden (ej: ORD-12345)' },
    ],
    exampleRequest: {},
    exampleResponse: {
      id: 'clxyz...',
      status: 'pending',
      externalOrderId: 'ORD-12345',
      provider: 'shalom',
      destination: 'Arequipa - Arequipa',
      courierCost: 12.50,
      tenantCost: 13.13,
    },
  },
  {
    method: 'POST',
    path: '/courier/estimate-box',
    name: 'Estimar caja (3D)',
    description: 'Calcula las dimensiones óptimas del empaque usando algoritmo 3D bin-packing. Útil para mostrar al cliente el tamaño estimado.',
    params: [
      { name: 'items', type: 'array', required: true, description: 'Array de items: { length, width, height, weight, quantity } (cm/kg)' },
    ],
    exampleRequest: [
      { length: 30, width: 20, height: 15, weight: 1.5, quantity: 2 },
    ],
    exampleResponse: {
      length: 30, width: 20, height: 30, totalWeight: 3, totalVolume: 18000, boxVolume: 18000, efficiency: 100,
    },
  },
  {
    method: 'POST',
    path: '/courier/quote/compare',
    name: 'Comparar couriers (directo)',
    description: 'Compara precios entre todos los couriers para un destino. Endpoint de capa 1 (sin margen de empresa).',
    params: [
      { name: 'destination', type: 'string', required: true, description: 'Destino: "Arequipa - Arequipa - Arequipa"' },
      { name: 'weight', type: 'number', required: true, description: 'Peso en kg' },
      { name: 'length', type: 'number', required: false, description: 'Largo en cm' },
      { name: 'width', type: 'number', required: false, description: 'Ancho en cm' },
      { name: 'height', type: 'number', required: false, description: 'Alto en cm' },
    ],
    exampleRequest: {
      destination: 'Arequipa - Arequipa - Arequipa',
      weight: 2,
      length: 30,
      width: 20,
      height: 15,
    },
    exampleResponse: [
      { provider: 'shalom', services: [{ serviceType: 'Agencia', price: 18.00, currency: 'PEN' }] },
    ],
  },
  // ─── Endpoints adicionales ─────────────────────────────────────
  {
    method: 'GET',
    path: '/quote-history',
    name: 'Historial de cotizaciones',
    description: 'Obtiene el historial de cotizaciones realizadas desde tu API (últimos 30 días).',
    params: [
      { name: 'limit', type: 'number', required: false, description: 'Límite de resultados (default: 50)' },
      { name: 'offset', type: 'number', required: false, description: 'Offset para paginación' },
    ],
    exampleRequest: {},
    exampleResponse: {
      quotes: [
        { id: 'xyz', destination: 'Arequipa', weight: 2.5, createdAt: '2026-03-13T10:00:00Z', source: 'api' }
      ],
      total: 1,
      limit: 50,
      offset: 0,
    },
  },
]

function ApiKeysSection() {
  const { data: keys, isLoading, refetch } = useApiKeys()
  const createMutation = useCreateApiKey()
  const revokeMutation = useRevokeApiKey()
  const [newKeyName, setNewKeyName] = useState('')
  const [showNewKey, setShowNewKey] = useState<CreateApiKeyResponse | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error('Ingresa un nombre para la API Key')
      return
    }
    try {
      const result = await createMutation.mutateAsync(newKeyName.trim())
      setShowNewKey(result)
      setNewKeyName('')
      refetch()
      toast.success('API Key creada correctamente')
    } catch {
      toast.error('Error al crear API Key')
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm('¿Estás seguro de revocar esta API Key?')) return
    try {
      await revokeMutation.mutateAsync(keyId)
      refetch()
      toast.success('API Key revocada')
    } catch {
      toast.error('Error al revocar API Key')
    }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  if (isLoading) {
    return <Skeleton className="h-32" />
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="Nombre de la API Key (ej: Mi Tienda Shopify)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={createMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          {createMutation.isPending ? 'Creando...' : 'Generar'}
        </Button>
      </div>

      {showNewKey && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">API Key creada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Copia esta key ahora. No podrás verla de nuevo.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowNewKey(null)}>
                Cerrar
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              <code className="flex-1 bg-background p-2 rounded text-xs font-mono break-all">
                {showNewKey.key}
              </code>
              <Button size="sm" variant="outline" onClick={() => copyKey(showNewKey.key)}>
                {copiedKey === showNewKey.key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {keys?.map((key) => (
          <Card key={key.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.prefix}...••••••••</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={key.isActive ? 'default' : 'secondary'}>
                    {key.isActive ? 'Activa' : 'Revocada'}
                  </Badge>
                  {key.isActive && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => handleRevoke(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {key.lastUsedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Última vez usada: {new Date(key.lastUsedAt).toLocaleString('es-PE')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {keys?.length === 0 && !showNewKey && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay API Keys. Crea una para integrar tu tienda.
          </p>
        )}
      </div>
    </div>
  )
}

function EndpointsSection({ apiKey }: { apiKey?: string }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0])
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState<unknown>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request')

  useEffect(() => {
    setRequestBody(JSON.stringify(selectedEndpoint.exampleRequest, null, 2))
    setResponse(null)
    setResponseStatus(null)
  }, [selectedEndpoint])

  const testEndpoint = async () => {
    setIsLoading(true)
    setActiveTab('response')
    try {
      const url = `${API_BASE_URL}${selectedEndpoint.path}`
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        },
      }

      if (selectedEndpoint.method === 'POST') {
        options.body = requestBody
      }

      const res = await fetch(url, options)
      setResponseStatus(res.status)
      const data = await res.json()
      setResponse(data)
    } catch (err) {
      setResponseStatus(500)
      setResponse({ error: 'Error al conectar con el servidor' })
    } finally {
      setIsLoading(false)
    }
  }

  const getCodeExamples = (endpoint: Endpoint) => {
    const key = apiKey || 'TU_API_KEY'
    
    return {
      curl: `curl -X ${endpoint.method} "${API_BASE_URL}${endpoint.path}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${key}" \\
  -d '${JSON.stringify(endpoint.exampleRequest)}'`,
      js: `fetch("${API_BASE_URL}${endpoint.path}", {
  method: "${endpoint.method}",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${key}"
  },
  body: JSON.stringify(${JSON.stringify(endpoint.exampleRequest, null, 2).replace(/"/g, "'")})
})
.then(res => res.json())
.thenconsole.log);`,
      python: `import requests

response = requests.${endpoint.method.toLowerCase()}(
    "${API_BASE_URL}${endpoint.path}",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "${key}"
    },
    json=${JSON.stringify(endpoint.exampleRequest, null, 4)}
)

print(response.json())`
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ENDPOINTS.map((ep) => (
          <Button
            key={ep.path}
            variant={selectedEndpoint.path === ep.path ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedEndpoint(ep)}
          >
            <Badge variant="secondary" className="mr-2 text-[10px]">{ep.method}</Badge>
            {ep.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant={selectedEndpoint.method === 'GET' ? 'outline' : 'default'}>
              {selectedEndpoint.method}
            </Badge>
            <code className="text-sm font-mono">{selectedEndpoint.path}</code>
          </div>
          <CardDescription>{selectedEndpoint.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedEndpoint.params.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2">Parámetros:</p>
              <div className="space-y-1">
                {selectedEndpoint.params.map((p) => (
                  <div key={p.name} className="text-xs flex gap-2">
                    <code className="bg-muted px-1 rounded">{p.name}</code>
                    <span className="text-muted-foreground">({p.type})</span>
                    {p.required && <Badge variant="destructive" className="text-[10px] h-4">req</Badge>}
                    <span className="text-muted-foreground">- {p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={testEndpoint} disabled={isLoading || !apiKey} size="sm">
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Probando...' : 'Probar endpoint'}
            </Button>
            {!apiKey && <span className="text-xs text-yellow-600">Selecciona una API Key para probar</span>}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'request' | 'response')}>
            <TabsList>
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>
            <TabsContent value="request">
              <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
                {requestBody || '{}'}
              </pre>
            </TabsContent>
            <TabsContent value="response">
              {responseStatus && (
                <Badge variant={responseStatus < 400 ? 'default' : 'destructive'} className="mb-2">
                  Status: {responseStatus}
                </Badge>
              )}
              <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
                {response ? JSON.stringify(response, null, 2) : 'Sin respuesta'}
              </pre>
            </TabsContent>
          </Tabs>

          <Separator />

          <div>
            <p className="text-xs font-medium mb-2">Ejemplos de código:</p>
            <Tabs defaultValue="curl">
              <TabsList>
                <TabsTrigger value="curl" className="text-xs">cURL</TabsTrigger>
                <TabsTrigger value="js" className="text-xs">JavaScript</TabsTrigger>
                <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto mt-2">
                  {getCodeExamples(selectedEndpoint).curl}
                </pre>
              </TabsContent>
              <TabsContent value="js">
                <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto mt-2">
                  {getCodeExamples(selectedEndpoint).js}
                </pre>
              </TabsContent>
              <TabsContent value="python">
                <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto mt-2">
                  {getCodeExamples(selectedEndpoint).python}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmpresaApiPage() {
  const { data: keys } = useApiKeys()
  const [testApiKey, setTestApiKey] = useState('')

  return (
    <BaseLayout title="API para mi Tienda" description="Endpoints para integrar cotización de envíos en tu marketplace">
      <div className="px-4 lg:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Integración de Shipping API</h2>
            <p className="text-sm text-muted-foreground">
              Usa estos endpoints para que tus clientes coticen envíos en tu tienda
            </p>
          </div>
        </div>

        <Tabs defaultValue="keys">
          <TabsList>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="h-4 w-4" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="gap-2">
              <Code className="h-4 w-4" /> Endpoints
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-2">
              <Terminal className="h-4 w-4" /> Probar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="mt-4">
            <ApiKeysSection />
          </TabsContent>

          <TabsContent value="endpoints" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Box className="h-4 w-4" /> Endpoints disponibles
                </CardTitle>
                <CardDescription>
                  Lista de endpoints REST para integrar en tu marketplace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ENDPOINTS.map((ep) => (
                  <div key={ep.path} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={ep.method === 'GET' ? 'outline' : 'default'} className="text-xs">
                        {ep.method}
                      </Badge>
                      <code className="text-sm font-mono">{ep.path}</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ep.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {ep.params.map((p) => (
                        <Badge key={p.name} variant="secondary" className="text-[10px]">
                          {p.name}
                          {p.required && ' *'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> Consola de prueba
                </CardTitle>
                <CardDescription>
                  Pega tu API Key para probar los endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                {keys && keys.filter(k => k.isActive).length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Label className="shrink-0">API Key:</Label>
                      <Input
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={testApiKey}
                        onChange={(e) => setTestApiKey(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    <EndpointsSection apiKey={testApiKey} />
                  </div>
                ) : (
                  <p className="text-sm text-yellow-600">
                    Crea una API Key primero para probar los endpoints
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
