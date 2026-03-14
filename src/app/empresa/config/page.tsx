import { BaseLayout } from "@/components/layouts/base-layout"
import { useTenantConfig } from "@/hooks/useTenantConfig"
import { useUpdateCourierConfig } from "@/hooks/useUpdateCourierConfig"
import { useCourierOrigins } from "@/hooks/useCourierOrigins"
import { COURIERS, type TenantCourierConfig } from "@/types/logistics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OriginCombobox } from "@/components/origin-combobox"
import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

const MERCHANDISE_TYPES = [
  { value: "sobre", label: "Sobre" },
  { value: "paquete", label: "Paquete" },
  { value: "otra_medida", label: "Otra medida" },
]

function CourierConfigCard({
  slug,
  courierConfig,
  canEdit,
}: {
  slug: string
  courierConfig: TenantCourierConfig
  canEdit: boolean
}) {
  const updateConfig = useUpdateCourierConfig()
  const { data: origins, isLoading: originsLoading } = useCourierOrigins(courierConfig.provider)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<TenantCourierConfig>>({})

  const provider = courierConfig.provider
  const info = COURIERS[provider]

  const handleSave = async () => {
    if (!Object.keys(formData).length) return
    try {
      await updateConfig.mutateAsync({ slug, provider, ...formData })
      toast.success(`Configuración de ${info?.name ?? provider} actualizada`)
      setIsEditing(false)
      setFormData({})
    } catch {
      toast.error("Error al guardar configuración")
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({})
  }

  const currentOrigin = isEditing
    ? formData.defaultOrigin ?? courierConfig.defaultOrigin ?? ""
    : courierConfig.defaultOrigin ?? ""

  const currentMerchandiseType = isEditing
    ? formData.merchandiseType ?? courierConfig.merchandiseType ?? ""
    : courierConfig.merchandiseType ?? ""

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {info?.name ?? provider}
            <Badge variant={courierConfig.isActive ? "default" : "secondary"} className="text-xs">
              {courierConfig.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          {canEdit && (
            <Switch
              checked={courierConfig.isActive}
              onCheckedChange={(checked) => {
                updateConfig.mutate(
                  { slug, provider, isActive: checked },
                  { onSuccess: () => toast.success(`${info?.name} ${checked ? "activado" : "desactivado"}`) }
                )
              }}
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Margen (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={isEditing ? formData.marginPercent ?? courierConfig.marginPercent ?? "" : courierConfig.marginPercent ?? ""}
              disabled={!canEdit || !isEditing}
              onChange={(e) => setFormData({ ...formData, marginPercent: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Prioridad</Label>
            <Input
              type="number"
              value={isEditing ? formData.priority ?? courierConfig.priority ?? "" : courierConfig.priority ?? ""}
              disabled={!canEdit || !isEditing}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tipo Mercadería</Label>
            {isEditing ? (
              <Select
                value={currentMerchandiseType}
                onValueChange={(v) => setFormData({ ...formData, merchandiseType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {MERCHANDISE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={currentMerchandiseType} disabled />
            )}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Origen Default</Label>
          {isEditing ? (
            originsLoading ? (
              <Skeleton className="h-9" />
            ) : (
              <OriginCombobox
                origins={origins || []}
                value={currentOrigin}
                onValueChange={(v) => setFormData({ ...formData, defaultOrigin: v })}
                placeholder="Buscar origen..."
                showHierarchy={provider === "olva"}
                showFullDetails={provider === "scharff"}
              />
            )
          ) : (
            <Input value={currentOrigin} disabled title={currentOrigin} className="truncate" />
          )}
        </div>

        {/* Origin detail hint */}
        {!isEditing && currentOrigin && (
          <div className="text-xs text-muted-foreground">
            Formato: <span className="font-mono">{info?.format}</span> · Ejemplo: <span className="font-mono">{info?.example}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Badge variant={courierConfig.marginPercent > 0 ? "default" : "destructive"}>
            {courierConfig.marginPercent > 0 ? `Margen ${courierConfig.marginPercent}%` : "Sin margen"}
          </Badge>
          {canEdit && (
            <>
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={updateConfig.isPending}>
                    {updateConfig.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>Editar</Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function EmpresaConfigPage() {
  const { user } = useAuth()
  const tenantSlug = user?.tenantSlug || "lyrium"
  const canEdit = user?.permissions.includes("config:write") ?? false

  const { data: config, isLoading } = useTenantConfig(tenantSlug)

  if (isLoading) {
    return (
      <BaseLayout title="Configuración" description={`Configuración de ${user?.tenantName}`}>
        <div className="px-4 lg:px-6">
          <Skeleton className="h-64" />
        </div>
      </BaseLayout>
    )
  }

  const courierConfigs = config?.configs || []

  return (
    <BaseLayout title="Configuración" description={`Configuración de ${user?.tenantName}`}>
      <div className="px-4 lg:px-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Nombre</Label>
                <p className="font-medium">{config?.tenant.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Slug</Label>
                <p className="font-mono">{config?.tenant.slug}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <Badge variant={config?.tenant.isActive ? "default" : "secondary"}>
                  {config?.tenant.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {courierConfigs.map((cc) => (
            <CourierConfigCard key={cc.provider} slug={tenantSlug} courierConfig={cc} canEdit={canEdit} />
          ))}
        </div>

        {!canEdit && (
          <Card>
            <CardContent className="pt-4 text-center text-muted-foreground">
              No tienes permisos para editar la configuración.
            </CardContent>
          </Card>
        )}
      </div>
    </BaseLayout>
  )
}
