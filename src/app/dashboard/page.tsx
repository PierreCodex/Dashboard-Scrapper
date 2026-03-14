import { Link } from "react-router-dom"
import { BaseLayout } from "@/components/layouts/base-layout"
import { useTenants } from "@/hooks/useTenants"
import { useCourierStats } from "@/hooks/useCourierStats"
import { COURIERS } from "@/types/logistics"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Truck, Building2, Calculator, Package, ArrowRight, Activity, Users, MapPin, Send } from "lucide-react"

function MetricCard({ title, value, subtitle, icon: Icon, loading, href }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  loading?: boolean
  href?: string
}) {
  const content = (
    <Card className={href ? "hover:border-primary cursor-pointer transition-colors" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

function CouriersGrid() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Couriers del Sistema</CardTitle>
        <CardDescription>Motores de cotizacion disponibles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(COURIERS).map(([key, info]) => (
            <Link key={key} to={`/couriers/${key}`}>
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center space-y-2">
                <Truck className="h-8 w-8 mx-auto text-primary" />
                <div className="font-medium">{info.name}</div>
                <Badge variant={info.status === "implemented" ? "default" : "secondary"}>
                  {info.status === "implemented" ? "Activo" : "Pendiente"}
                </Badge>
                <p className="text-xs text-muted-foreground truncate">{info.format}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TenantsTable() {
  const { data: tenants, isLoading } = useTenants()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tenants (Empresas)</CardTitle>
          <CardDescription>Empresas registradas en el motor logistico</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : tenants && tenants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Couriers</TableHead>
                <TableHead>Ciudades</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Envios</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.isActive ? "default" : "destructive"}>
                      {tenant.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3 text-muted-foreground" />
                      {tenant._count.courierConfigs}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {tenant._count.locationMappings}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {tenant._count.users}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Send className="h-3 w-3 text-muted-foreground" />
                      {tenant._count.shipments}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/tenants/${tenant.slug}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No hay tenants registrados</p>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rapidas</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Button variant="outline" asChild>
          <Link to="/simulate">
            <Calculator className="h-4 w-4 mr-2" />
            Cotizador Courier
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/shipments">
            <Package className="h-4 w-4 mr-2" />
            Buscar Envio
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/couriers/shalom">
            <Truck className="h-4 w-4 mr-2" />
            Agencias Shalom
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/couriers/olva">
            <Truck className="h-4 w-4 mr-2" />
            Agencias Olva
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: tenants, isLoading: tenantsLoading } = useTenants()
  const { data: stats, isLoading: statsLoading } = useCourierStats()

  const totalTenants = tenants?.length ?? 0
  const activeTenants = tenants?.filter(t => t.isActive).length ?? 0
  const totalShipments = tenants?.reduce((sum, t) => sum + t._count.shipments, 0) ?? 0
  const totalMappings = tenants?.reduce((sum, t) => sum + t._count.locationMappings, 0) ?? 0

  return (
    <BaseLayout title="Dashboard" description="Panel de administracion del motor logistico">
      <div className="px-4 lg:px-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Couriers"
            value={Object.keys(COURIERS).length}
            subtitle={`${Object.values(COURIERS).filter(c => c.status === 'implemented').length} implementados`}
            icon={Truck}
          />
          <MetricCard
            title="Tenants"
            value={activeTenants}
            subtitle={`${totalTenants} registrados`}
            icon={Building2}
            loading={tenantsLoading}
          />
          <MetricCard
            title="Mappings"
            value={totalMappings}
            subtitle="Rutas configuradas"
            icon={MapPin}
            loading={tenantsLoading}
          />
          <MetricCard
            title="Envios"
            value={totalShipments}
            subtitle="Total procesados"
            icon={Package}
            loading={tenantsLoading}
            href="/shipments"
          />
          <MetricCard
            title="Browser Pool"
            value={`${stats?.browserPool.active ?? 0}/${stats?.browserPool.maxConcurrent ?? 5}`}
            subtitle={`${stats?.browserPool.queued ?? 0} en cola`}
            icon={Activity}
            loading={statsLoading}
          />
        </div>

        <TenantsTable />

        <div className="grid gap-6 lg:grid-cols-2">
          <CouriersGrid />
          <QuickActions />
        </div>
      </div>
    </BaseLayout>
  )
}