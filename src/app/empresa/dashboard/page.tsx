import { BaseLayout } from "@/components/layouts/base-layout"
import { useTenantConfig } from "@/hooks/useTenantConfig"
import { useTenantLocations } from "@/hooks/useTenantLocations"
import { COURIERS } from "@/types/logistics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Truck, MapPin, Calculator, Package } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

function MetricCard({ title, value, icon: Icon, loading }: { title: string; value: string | number; icon: React.ElementType; loading?: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  )
}

export default function EmpresaDashboardPage() {
  const { user } = useAuth()
  const tenantSlug = user?.tenantSlug || "lyrium"
  
  const { data: config, isLoading: configLoading } = useTenantConfig(tenantSlug)
  const { data: locations, isLoading: locationsLoading } = useTenantLocations(tenantSlug)

  const activeCouriers = config?.configs.filter(c => c.isActive).length ?? 0
  const totalLocations = locations?.length ?? 0

  return (
    <BaseLayout title={`Dashboard - ${user?.tenantName}`} description={`Bienvenido a ${user?.tenantName}`}>
      <div className="px-4 lg:px-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Couriers Activos"
            value={activeCouriers}
            icon={Truck}
            loading={configLoading}
          />
          <MetricCard
            title="Ciudades Mapeadas"
            value={totalLocations}
            icon={MapPin}
            loading={locationsLoading}
          />
          <MetricCard
            title="Cotizaciones Hoy"
            value="0"
            icon={Calculator}
          />
          <MetricCard
            title="Envíos Pendientes"
            value="0"
            icon={Package}
          />
        </div>

        {config && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Couriers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Courier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Margen</TableHead>
                    <TableHead>Prioridad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.configs.map((courierConfig) => {
                    const courierInfo = COURIERS[courierConfig.provider]
                    return (
                      <TableRow key={courierConfig.provider}>
                        <TableCell className="font-medium">{courierInfo?.name || courierConfig.provider}</TableCell>
                        <TableCell>
                          <Badge variant={courierConfig.isActive ? "default" : "secondary"}>
                            {courierConfig.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {courierConfig.marginPercent ? (
                            <span className={courierConfig.marginPercent > 0 ? "text-green-600" : "text-red-600"}>
                              {courierConfig.marginPercent}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{courierConfig.priority ?? "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </BaseLayout>
  )
}
