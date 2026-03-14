import { BaseLayout } from "@/components/layouts/base-layout"
import { useQuoteHistory, useQuoteStats, type QuoteHistory, type QuoteHistoryItem, type BoxDimensions } from "@/hooks/useQuoteHistory"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { 
  History, TrendingUp, ArrowUpDown, Eye, Package, Ruler
} from "lucide-react"

function StatsCards() {
  const { data: stats, isLoading } = useQuoteStats(30)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total cotizaciones (30 días)</CardDescription>
          <CardTitle className="text-3xl">{stats?.totalQuotes || 0}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Por API</CardDescription>
          <CardTitle className="text-3xl">
            {stats?.byProvider.find(p => p.provider === 'api')?.count || 0}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Por Panel</CardDescription>
          <CardTitle className="text-3xl">
            {stats?.byProvider.find(p => p.provider === 'panel')?.count || 0}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

function QuoteDetailsModal({ quote, children }: { quote: QuoteHistory; children?: React.ReactNode }) {
  const items = quote.items as QuoteHistoryItem[] | null
  const box = quote.boxDimensions as BoxDimensions | null

  return (
    <Dialog>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Cotización</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Info general */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Fecha:</span>
              <p className="font-medium">{new Date(quote.createdAt).toLocaleString('es-PE')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fuente:</span>
              <p className="font-medium">{quote.source === 'api' ? 'API' : 'Panel'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Origen:</span>
              <p className="font-medium">{quote.origin || 'No especificado'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Destino:</span>
              <p className="font-medium">{quote.destination}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Proveedores:</span>
              <p className="font-medium">{quote.provider || 'Todos'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Peso total:</span>
              <p className="font-medium">{quote.weight.toFixed(2)} kg</p>
            </div>
          </div>

          {/* Dimensiones del paquete */}
          {box && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4" />
                <span className="font-medium">Paquete estimado</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Dimensiones:</span>
                  <p className="font-medium">{box.length} x {box.width} x {box.height} cm</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Eficiencia:</span>
                  <p className="font-medium">{box.efficiency?.toFixed(1) || 0}%</p>
                </div>
                {box.weight && (
                  <div>
                    <span className="text-muted-foreground">Peso:</span>
                    <p className="font-medium">{box.weight.toFixed(2)} kg</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          {items && items.length > 0 && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4" />
                <span className="font-medium">Items ({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <span className="font-medium">x{item.quantity}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {item.length}x{item.width}x{item.height} cm • {item.weight} kg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultado */}
          {(quote.courierCost || quote.tenantCost) && (
            <div className="border rounded-lg p-3 bg-muted/50">
              <span className="font-medium">Resultado</span>
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <div>
                  <span className="text-muted-foreground">Costo courier:</span>
                  <p className="font-medium">S/ {quote.courierCost?.toFixed(2) || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Costo final:</span>
                  <p className="font-medium">S/ {quote.tenantCost?.toFixed(2) || '-'}</p>
                </div>
                {quote.serviceType && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Servicio:</span>
                    <p className="font-medium">{quote.serviceType}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function QuoteHistoryTable() {
  const [provider, setProvider] = useState<string | undefined>()
  const { data, isLoading, refetch } = useQuoteHistory({ provider })

  if (isLoading) {
    return <Skeleton className="h-96" />
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Filtrar:</span>
          <Select value={provider || "all"} onValueChange={(v) => setProvider(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="panel">Panel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 text-sm font-medium">Fecha</th>
              <th className="text-left p-3 text-sm font-medium">Origen</th>
              <th className="text-left p-3 text-sm font-medium">Destino</th>
              <th className="text-left p-3 text-sm font-medium">Proveedor</th>
              <th className="text-left p-3 text-sm font-medium">Peso</th>
              <th className="text-left p-3 text-sm font-medium">Dimensiones</th>
              <th className="text-left p-3 text-sm font-medium">Items</th>
              <th className="text-left p-3 text-sm font-medium">Fuente</th>
              <th className="text-left p-3 text-sm font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data?.quotes.map((quote) => (
              <tr key={quote.id} className="border-b hover:bg-muted/30">
                <td className="p-3 text-sm">
                  {new Date(quote.createdAt).toLocaleString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-3 text-sm">{quote.origin || '-'}</td>
                <td className="p-3 text-sm">{quote.destination}</td>
                <td className="p-3 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {quote.provider || 'Todos'}
                  </Badge>
                </td>
                <td className="p-3 text-sm">{quote.weight.toFixed(2)} kg</td>
                <td className="p-3 text-sm">
                  {quote.length && quote.width && quote.height ? (
                    <span className="text-xs">{quote.length}x{quote.width}x{quote.height}</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-3 text-sm">
                  {quote.items ? (quote.items as any[]).length : '-'}
                </td>
                <td className="p-3">
                  <Badge variant={quote.source === 'api' ? 'default' : 'secondary'}>
                    {quote.source === 'api' ? 'API' : 'Panel'}
                  </Badge>
                </td>
                <td className="p-3">
                  <QuoteDetailsModal quote={quote}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </QuoteDetailsModal>
                </td>
              </tr>
            ))}
            {data?.quotes.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  No hay cotizaciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > data.limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.offset === 0}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground py-2">
            {data.offset + 1}-{Math.min(data.offset + data.limit, data.total)} de {data.total}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.offset + data.limit >= data.total}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}

export default function QuoteHistoryPage() {
  return (
    <BaseLayout title="Historial de Cotizaciones" description="Revisa el historial de cotizaciones de tu empresa">
      <div className="px-4 lg:px-6 space-y-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" /> Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <StatsCards />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <QuoteHistoryTable />
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
