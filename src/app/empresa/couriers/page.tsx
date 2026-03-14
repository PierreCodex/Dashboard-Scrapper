import { BaseLayout } from "@/components/layouts/base-layout"
import { useTenantConfig } from "@/hooks/useTenantConfig"
import { COURIERS } from "@/types/logistics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PermissionGate } from "@/components/router/permission-gate"
import { useSyncAgencies } from "@/hooks/useSyncAgencies"
import { toast } from "sonner"

function CourierCard({ provider, config }: { provider: string; config?: { isActive: boolean; marginPercent: number; priority: number } }) {
  const info = COURIERS[provider]
  const syncMutation = useSyncAgencies(provider)

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync()
      toast.success(`Sincronización completada: ${result.created} creadas, ${result.updated} actualizadas`)
    } catch {
      toast.error("Error al sincronizar agencias")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {info?.name || provider}
          <Badge variant={config?.isActive ? "default" : "secondary"}>
            {config?.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Margen:</span>
          <span>{config?.marginPercent ?? "-"}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Prioridad:</span>
          <span>{config?.priority ?? "-"}</span>
        </div>
        <PermissionGate permission="agencies:sync">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncMutation.isPending} className="w-full mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            {syncMutation.isPending ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </PermissionGate>
      </CardContent>
    </Card>
  )
}

export default function EmpresaCouriersPage() {
  const { user } = useAuth()
  const tenantSlug = user?.tenantSlug || "lyrium"

  const { data: config, isLoading } = useTenantConfig(tenantSlug)

  if (isLoading) {
    return (
      <BaseLayout title="Mis Couriers" description={`Couriers configurados para ${user?.tenantName}`}>
        <div className="px-4 lg:px-6">
          <Skeleton className="h-64" />
        </div>
      </BaseLayout>
    )
  }

  const activeConfigs = config?.configs.filter(c => c.isActive) || []

  return (
    <BaseLayout title="Mis Couriers" description={`Couriers configurados para ${user?.tenantName}`}>
      <div className="px-4 lg:px-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {config?.configs.map((courierConfig) => (
            <CourierCard
              key={courierConfig.provider}
              provider={courierConfig.provider}
              config={courierConfig}
            />
          ))}
        </div>

        {activeConfigs.length === 0 && (
          <Card>
            <CardContent className="pt-4 text-center text-muted-foreground">
              No hay couriers configurados para este tenant.
            </CardContent>
          </Card>
        )}
      </div>
    </BaseLayout>
  )
}
