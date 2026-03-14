import { BaseLayout } from "@/components/layouts/base-layout"
import { useShipmentByOrder } from "@/hooks/useShipmentByOrder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Search, Package } from "lucide-react"

function getStatusColor(status: string) {
  const statusLower = status.toLowerCase()
  if (statusLower.includes("delivered") || statusLower.includes("entregado")) {
    return "bg-green-500"
  }
  if (statusLower.includes("pending") || statusLower.includes("pendiente")) {
    return "bg-yellow-500"
  }
  if (statusLower.includes("cancel") || statusLower.includes("cancelado")) {
    return "bg-red-500"
  }
  return "bg-blue-500"
}

export default function ShipmentsPage() {
  const [orderId, setOrderId] = useState("")
  const { data: shipment, isLoading, isError } = useShipmentByOrder(orderId)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <BaseLayout title="Envíos" description="Busca envíos por externalOrderId">
      <div className="px-4 lg:px-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Envío
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="orderId">externalOrderId</Label>
                <Input
                  id="orderId"
                  placeholder="Ingresa el ID del pedido..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={!orderId || isLoading}>
                  {isLoading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading && <Skeleton className="h-64" />}

        {isError && (
          <Card className="border-red-500">
            <CardContent className="pt-4">
              <p className="text-red-500">Error al buscar el envío. Verifica el ID e intenta nuevamente.</p>
            </CardContent>
          </Card>
        )}

        {shipment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Envío {shipment.externalOrderId}
                <Badge className={getStatusColor(shipment.status)}>{shipment.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label className="text-muted-foreground">Provider</Label>
                  <p className="font-medium capitalize">{shipment.provider}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Servicio</Label>
                  <p className="font-medium">{shipment.serviceType || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Método de Entrega</Label>
                  <p className="font-medium">
                    {shipment.deliveryMethod === "AGENCY_PICKUP"
                      ? "Recojo en agencia"
                      : shipment.deliveryMethod === "HOME_DELIVERY"
                      ? "Delivery a domicilio"
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Costo Courier</Label>
                  <p className="font-medium">S/ {shipment.courierCost.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Costo Tenant</Label>
                  <p className="font-medium">S/ {shipment.tenantCost.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p className="font-medium">{new Date(shipment.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{shipment.customerName}</p>
                </div>
                {shipment.customerPhone && (
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">{shipment.customerPhone}</p>
                  </div>
                )}
                {shipment.customerEmail && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{shipment.customerEmail}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!shipment && !isLoading && orderId && !isError && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground">No se encontró ningún envío con ese ID.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </BaseLayout>
  )
}
