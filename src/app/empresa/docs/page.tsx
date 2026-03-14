import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { 
  BookOpen, Settings, Truck, MapPin, 
  Key, History, Calculator, Play, Copy, Check
} from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  name: string
  description: string
  auth?: string
  params?: { name: string; type: string; required: boolean; description: string }[]
  body?: unknown
  response: unknown
}

interface ApiCategory {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  endpoints: ApiEndpoint[]
}

const API_CATEGORIES: ApiCategory[] = [
  {
    id: 'api-keys',
    name: 'API Keys',
    icon: <Key className="h-4 w-4" />,
    description: 'Gestión de claves API para integración externa',
    endpoints: [
      {
        method: 'GET',
        path: '/api-keys',
        name: 'Listar API Keys',
        description: 'Obtiene todas las API Keys del tenant actual',
        auth: 'JWT Token',
        response: {
          "id": "key_xxx",
          "name": "Mi Tienda",
          "prefix": "sk_live_xxx",
          "isActive": true,
          "lastUsedAt": "2026-03-13T10:00:00Z",
          "createdAt": "2026-01-01T00:00:00Z"
        }
      },
      {
        method: 'POST',
        path: '/api-keys',
        name: 'Crear API Key',
        description: 'Genera una nueva clave API',
        auth: 'JWT Token',
        body: { name: "Mi Tienda Shopify" },
        response: {
          "id": "key_xxx",
          "name": "Mi Tienda Shopify",
          "key": "sk_live_xxxxxxxxxxxxxxxxxxxxx",
          "prefix": "sk_live_xxx",
          "createdAt": "2026-03-13T10:00:00Z"
        }
      },
      {
        method: 'DELETE',
        path: '/api-keys/:id',
        name: 'Revocar API Key',
        description: 'Invalida una clave API existente',
        auth: 'JWT Token',
        response: { "success": true }
      }
    ]
  },
  {
    id: 'config',
    name: 'Configuración',
    icon: <Settings className="h-4 w-4" />,
    description: 'Configuración del tenant y couriers',
    endpoints: [
      {
        method: 'GET',
        path: '/logistics/tenants/:slug/config',
        name: 'Obtener config del tenant',
        description: 'Retorna la configuración de couriers, orígenes y márgenes del tenant',
        auth: 'JWT o API Key',
        response: {
          "slug": "mitienda",
          "name": "Mi Tienda",
          "couriers": [
            {
              "provider": "shalom",
              "enabled": true,
              "defaultOrigin": "Lima - Lima",
              "margins": { "minMargin": 5, "defaultMargin": 10 },
              "services": ["Agencia", "Delivery"]
            }
          ]
        }
      }
    ]
  },
  {
    id: 'couriers',
    name: 'Couriers',
    icon: <Truck className="h-4 w-4" />,
    description: 'Información de couriers y agencias',
    endpoints: [
      {
        method: 'GET',
        path: '/courier/:provider/origins',
        name: 'Orígenes disponibles',
        description: 'Lista las ciudades de origen configuradas para un courier',
        auth: 'JWT o API Key',
        params: [
          { name: 'provider', type: 'string', required: true, description: 'Nombre del courier (shalom, olva, urbano, scharff)' }
        ],
        response: [
          { "code": "LIM", "name": "Lima - Lima", "department": "Lima" },
          { "code": "ARE", "name": "Arequipa - Arequipa", "department": "Arequipa" }
        ]
      },
      {
        method: 'GET',
        path: '/geography/courier/:provider/agencies',
        name: 'Agencias por courier',
        description: 'Lista las agencias de un courier por departamento',
        auth: 'JWT o API Key',
        params: [
          { name: 'provider', type: 'string', required: true, description: 'Courier (shalom, olva, urbano, scharff)' },
          { name: 'dept', type: 'string', required: false, description: 'Código de departamento' }
        ],
        response: [
          { "id": "agency_xxx", "agencyCode": "AG001", "name": "Agencia Central", "address": "Av. Principal 123", "district": "Lima", "province": "Lima", "department": "Lima" }
        ]
      }
    ]
  },
  {
    id: 'locations',
    name: 'Ubicaciones',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Destinos y ubicaciones disponibles',
    endpoints: [
      {
        method: 'GET',
        path: '/logistics/tenants/:slug/locations',
        name: 'Destinos del tenant',
        description: 'Lista ciudades y distritos configurados para el tenant',
        auth: 'JWT o API Key',
        response: {
          "interprovincial": [
            { "name": "Arequipa - Arequipa", "department": "Arequipa" },
            { "name": "Trujillo", "department": "La Libertad" }
          ],
          "local": {
            "urbano": [{ "name": "Miraflores", "department": "Lima" }],
            "scharff": [{ "name": "San Isidro", "department": "Lima" }]
          }
        }
      }
    ]
  },
  {
    id: 'shipping',
    name: 'Cotización',
    icon: <Calculator className="h-4 w-4" />,
    description: 'Cálculo de envíos y comparadores',
    endpoints: [
      {
        method: 'POST',
        path: '/logistics/shipping/calculate',
        name: 'Calcular envío',
        description: 'Calcula el costo de envío con los couriers configurados. Resuelve automáticamente márgenes.',
        auth: 'JWT o API Key',
        params: [
          { name: 'origin', type: 'string', required: false, description: 'Origen del envío (ej: "Lima - Lima"). Si no se envía, usa el defaultOrigin del courier.' },
          { name: 'destination', type: 'string', required: true, description: 'Ciudad destino' },
          { name: 'items', type: 'array', required: true, description: 'Artículos a enviar' },
          { name: 'providers', type: 'string[]', required: false, description: 'Couriers a usar' }
        ],
        body: {
          "destination": "Arequipa - Arequipa",
          "origin": "Lima - Lima",
          "items": [
            { "weightKg": 1.5, "lengthCm": 30, "widthCm": 20, "heightCm": 15, "quantity": 2 }
          ],
          "providers": ["shalom", "olva"]
        },
        response: {
          "tenantId": "tenant_xxx",
          "destination": "Arequipa - Arequipa",
          "options": [
            {
              "provider": "shalom",
              "serviceType": "Agencia",
              "courierCost": 12.50,
              "tenantCost": 13.75,
              "currency": "PEN",
              "breakdown": {
                "totalWeightKg": 3,
                "volumetricWeightKg": 1.8,
                "chargeableWeightKg": 3,
                "boxLengthCm": 30,
                "boxWidthCm": 20,
                "boxHeightCm": 30
              }
            }
          ],
          "skippedProviders": [],
          "calculatedAt": "2026-03-13T15:00:00.000Z"
        }
      },
      {
        method: 'POST',
        path: '/courier/estimate-box',
        name: 'Estimar caja 3D',
        description: 'Calcula dimensiones óptimas del empaque usando algoritmo bin-packing',
        auth: 'JWT o API Key',
        body: [
          { "length": 30, "width": 20, "height": 15, "weight": 1.5, "quantity": 2 }
        ],
        response: {
          "length": 30,
          "width": 20,
          "height": 30,
          "totalWeight": 3,
          "totalVolume": 18000,
          "boxVolume": 18000,
          "efficiency": 100
        }
      },
      {
        method: 'POST',
        path: '/courier/quote/compare',
        name: 'Comparar couriers directo',
        description: 'Compara precios entre couriers sin márgenes (capa 1)',
        auth: 'JWT o API Key',
        params: [
          { name: 'destination', type: 'string', required: true, description: 'Destino completo' },
          { name: 'weight', type: 'number', required: true, description: 'Peso en kg' },
          { name: 'length', type: 'number', required: false, description: 'Largo cm' },
          { name: 'width', type: 'number', required: false, description: 'Ancho cm' },
          { name: 'height', type: 'number', required: false, description: 'Alto cm' }
        ],
        body: {
          "destination": "Arequipa - Arequipa - Arequipa",
          "weight": 2,
          "length": 30,
          "width": 20,
          "height": 15
        },
        response: [
          {
            "provider": "shalom",
            "services": [
              { "serviceType": "Agencia", "price": 18.00, "currency": "PEN" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'history',
    name: 'Historial',
    icon: <History className="h-4 w-4" />,
    description: 'Historial de cotizaciones',
    endpoints: [
      {
        method: 'GET',
        path: '/quote-history',
        name: 'Listar historial',
        description: 'Obtiene el historial de cotizaciones del tenant',
        auth: 'JWT Token',
        params: [
          { name: 'provider', type: 'string', required: false, description: 'Filtrar por courier' },
          { name: 'startDate', type: 'string', required: false, description: 'Fecha inicio (ISO)' },
          { name: 'endDate', type: 'string', required: false, description: 'Fecha fin (ISO)' },
          { name: 'limit', type: 'number', required: false, description: 'Límite' },
          { name: 'offset', type: 'number', required: false, description: 'Offset' }
        ],
        response: {
          "quotes": [
            {
              "id": "quote_xxx",
              "provider": "shalom",
              "origin": "Lima - Lima",
              "destination": "Arequipa - Arequipa",
              "weight": 2.5,
              "packageType": "caja",
              "items": [
                { "length": 30, "width": 20, "height": 15, "weight": 1.5, "quantity": 2 }
              ],
              "courierCost": 12.50,
              "tenantCost": 13.75,
              "currency": "PEN",
              "serviceType": "Agencia",
              "source": "api",
              "createdAt": "2026-03-13T10:00:00Z"
            }
          ],
          "total": 150,
          "limit": 50,
          "offset": 0
        }
      },
      {
        method: 'GET',
        path: '/quote-history/stats',
        name: 'Estadísticas',
        description: 'Obtiene estadísticas de cotizaciones',
        auth: 'JWT Token',
        params: [
          { name: 'days', type: 'number', required: false, description: 'Días hacia atrás (default: 30)' }
        ],
        response: {
          "totalQuotes": 250,
          "byProvider": [
            { "provider": "shalom", "count": 150 },
            { "provider": "olva", "count": 100 }
          ],
          "recentQuotes": []
        }
      }
    ]
  }
]

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-500/10 text-green-600 border-green-500/20',
    POST: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    PUT: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    DELETE: 'bg-red-500/10 text-red-600 border-red-500/20'
  }
  
  return (
    <Badge variant="outline" className={`${colors[method] || ''} font-mono text-xs`}>
      {method}
    </Badge>
  )
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <MethodBadge method={endpoint.method} />
          <code className="text-sm font-mono">{endpoint.path}</code>
        </div>
        <CardTitle className="text-base">{endpoint.name}</CardTitle>
        <CardDescription>{endpoint.description}</CardDescription>
        {endpoint.auth && (
          <Badge variant="secondary" className="mt-1 w-fit text-xs">
            Auth: {endpoint.auth}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {endpoint.params && endpoint.params.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2">Parámetros:</p>
            <div className="bg-muted/50 rounded-md p-3 space-y-1">
              {endpoint.params.map((param) => (
                <div key={param.name} className="flex gap-2 text-xs">
                  <code className="font-mono text-blue-600">{param.name}</code>
                  <span className="text-muted-foreground">({param.type})</span>
                  {param.required && <Badge variant="destructive" className="text-[10px] h-4 px-1">req</Badge>}
                  <span className="text-muted-foreground">- {param.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {endpoint.body !== undefined && (
          <div>
            <p className="text-xs font-semibold mb-2">Request Body:</p>
            <pre className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto">
              {JSON.stringify(endpoint.body, null, 2)}
            </pre>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold mb-2">Response:</p>
          <pre className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto">
            {JSON.stringify(endpoint.response, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

function PostmanTester() {
  const [testApiKey, setTestApiKey] = useState('')
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [requestBody, setRequestBody] = useState('')
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})
  const [response, setResponse] = useState<unknown>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (selectedEndpoint) {
      setRequestBody(selectedEndpoint.body ? JSON.stringify(selectedEndpoint.body, null, 2) : '')
      setQueryParams({})
      setResponse(selectedEndpoint.response || null)
      setResponseStatus(null)
      setActiveTab('request')
    }
  }, [selectedEndpoint])

  const allEndpoints = API_CATEGORIES.flatMap(cat => 
    cat.endpoints.map(ep => ({ ...ep, category: cat.name }))
  )

  const testEndpoint = async () => {
    if (!selectedEndpoint) return
    setIsLoading(true)
    setActiveTab('response')
    try {
      let url = `${API_BASE_URL}${selectedEndpoint.path}`
      
      // Build query string from params
      const params = new URLSearchParams()
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      // Add query params to URL for GET requests
      if (selectedEndpoint.method === 'GET' && params.toString()) {
        url += `?${params.toString()}`
      }
      
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(testApiKey ? { 'X-API-Key': testApiKey } : {}),
        },
      }

      if (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') {
        try {
          options.body = JSON.stringify(JSON.parse(requestBody))
        } catch {
          options.body = requestBody
        }
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

  const copyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleParamChange = (paramName: string, value: string) => {
    setQueryParams(prev => ({ ...prev, [paramName]: value }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consola de Prueba</CardTitle>
          <CardDescription>
            Selecciona un endpoint y prueba la API directamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">API Key</Label>
            <Input
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
              className="font-mono text-xs mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pega tu API Key aquí (créala en la sección API Keys)
            </p>
          </div>

          <div>
            <Label className="text-xs">Endpoint</Label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
              value={selectedEndpoint?.path || ''}
              onChange={(e) => {
                const ep = allEndpoints.find(en => en.path === e.target.value)
                setSelectedEndpoint(ep || null)
              }}
            >
              <option value="">Selecciona un endpoint...</option>
              {API_CATEGORIES.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.endpoints.map(ep => (
                    <option key={ep.path} value={ep.path}>
                      {ep.method} {ep.path} - {ep.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {selectedEndpoint && (
            <>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Badge variant={selectedEndpoint.method === 'GET' ? 'outline' : 'default'}>
                  {selectedEndpoint.method}
                </Badge>
                <code className="text-sm font-mono">{API_BASE_URL}{selectedEndpoint.path}</code>
              </div>

              {/* Query params for GET */}
              {selectedEndpoint.method === 'GET' && selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                <div>
                  <Label className="text-xs">Parámetros de Query</Label>
                  <div className="space-y-2 mt-1">
                    {selectedEndpoint.params.map(p => (
                      <div key={p.name} className="flex gap-2 items-center">
                        <Input
                          placeholder={p.name}
                          value={queryParams[p.name] || ''}
                          onChange={(e) => handleParamChange(p.name, e.target.value)}
                          className="flex-1 text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-20">{p.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body for POST/PUT */}
              {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') && (
                <div>
                  <Label className="text-xs">Request Body</Label>
                  <Textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="font-mono text-xs mt-1"
                    rows={6}
                    placeholder='{"key": "value"}'
                  />
                </div>
              )}

              <Button onClick={testEndpoint} disabled={isLoading || !testApiKey} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? 'Ejecutando...' : 'Ejecutar Request'}
              </Button>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'request' | 'response')}>
                <TabsList>
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>
                <TabsContent value="request">
                  {selectedEndpoint.method === 'GET' ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">GET requests no tienen body. Los parámetros se envían en la URL.</p>
                      <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto max-h-[300px]">
                        {`GET ${API_BASE_URL}${selectedEndpoint.path}${Object.keys(queryParams).length > 0 ? '?' + new URLSearchParams(queryParams).toString() : ''}`}
                      </pre>
                    </div>
                  ) : (
                    <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto max-h-[300px]">
                      {requestBody || 'Sin body'}
                    </pre>
                  )}
                </TabsContent>
                <TabsContent value="response">
                  {responseStatus && (
                    <Badge variant={responseStatus < 400 ? 'default' : 'destructive'} className="mb-2">
                      Status: {responseStatus}
                    </Badge>
                  )}
                  {response ? (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0"
                        onClick={copyResponse}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto max-h-[300px]">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin respuesta aún</p>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmpresaDocsPage() {
  return (
    <BaseLayout title="Documentación de API" description="Referencia completa de endpoints disponibles">
      <div className="px-4 lg:px-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              API Reference
            </CardTitle>
            <CardDescription>
              Documentación de todos los endpoints disponibles para el panel de tenant e integración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="details">Detalle</TabsTrigger>
                <TabsTrigger value="postman">Probar API</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {API_CATEGORIES.map((category) => (
                    <Card key={category.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            {category.icon}
                          </div>
                          <CardTitle className="text-sm">{category.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                        <p className="text-xs font-medium mt-2">
                          {category.endpoints.length} endpoint{category.endpoints.length !== 1 ? 's' : ''}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-base">Autenticación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">JWT Token</p>
                      <p className="text-xs text-muted-foreground">
                        Para endpoints del panel (administración). Incluir en header:
                      </p>
                      <code className="block mt-1 bg-muted p-2 rounded text-xs font-mono">
                        Authorization: Bearer {'{token}'}
                      </code>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">API Key</p>
                      <p className="text-xs text-muted-foreground">
                        Para integración externa. Incluir en header:
                      </p>
                      <code className="block mt-1 bg-muted p-2 rounded text-xs font-mono">
                        X-API-Key: {'{api_key}'}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="details">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <Accordion type="multiple" defaultValue={API_CATEGORIES.map(c => c.id)} className="w-full">
                    {API_CATEGORIES.map((category) => (
                      <AccordionItem key={category.id} value={category.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-primary/10 text-primary">
                              {category.icon}
                            </div>
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {category.endpoints.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                          {category.endpoints.map((endpoint, idx) => (
                            <EndpointCard key={idx} endpoint={endpoint} />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="postman">
                <PostmanTester />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  )
}
