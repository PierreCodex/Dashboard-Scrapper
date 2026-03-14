import { useParams } from "react-router-dom"
import { BaseLayout } from "@/components/layouts/base-layout"
import { useTenantConfig } from "@/hooks/useTenantConfig"
import { useTenantLocations } from "@/hooks/useTenantLocations"
import { useLocationAgencies } from "@/hooks/useLocationAgencies"
import { useUpdateCourierConfig } from "@/hooks/useUpdateCourierConfig"
import { useShipmentByOrder } from "@/hooks/useShipmentByOrder"
import { COURIERS, type TenantCourierConfig, type TenantLocation } from "@/types/logistics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { toast } from "sonner"

function ConfigCouriersTab({ slug, config }: { slug: string; config: { tenant: { name: string }; configs: TenantCourierConfig[] } | undefined }) {
  const updateConfig = useUpdateCourierConfig()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, Partial<TenantCourierConfig>>>({})

  const handleSave = async (provider: string) => {
    const data = formData[provider]
    if (!data) return

    try {
      await updateConfig.mutateAsync({ slug, provider, ...data })
      toast.success(`Configuración de ${COURIERS[provider]?.name} actualizada`)
      setEditingId(null)
      setFormData({})
    } catch {
      toast.error("Error al guardar configuración")
    }
  }

  const providers = ["shalom", "olva"]

  return (
    <div className="space-y-4">
      {providers.map((provider) => {
        const courierConfig = config?.configs.find((c) => c.provider === provider)
        const info = COURIERS[provider]
        const isEditing = editingId === provider

        return (
          <Card key={provider}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {info?.name ?? provider}
                <Switch
                  checked={courierConfig?.isActive ?? false}
                  onCheckedChange={(checked) => {
                    updateConfig.mutate(
                      { slug, provider, isActive: checked },
                      { onSuccess: () => toast.success(`${info?.name} ${checked ? "activado" : "desactivado"}`) }
                    )
                  }}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Margen (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={isEditing ? formData[provider]?.marginPercent ?? courierConfig?.marginPercent ?? "" : courierConfig?.marginPercent ?? ""}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [provider]: { ...formData[provider], marginPercent: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <Input
                    type="number"
                    value={isEditing ? formData[provider]?.priority ?? courierConfig?.priority ?? "" : courierConfig?.priority ?? ""}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [provider]: { ...formData[provider], priority: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Tipo Mercadería</Label>
                  <Input
                    value={isEditing ? formData[provider]?.merchandiseType ?? courierConfig?.merchandiseType ?? "" : courierConfig?.merchandiseType ?? ""}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [provider]: { ...formData[provider], merchandiseType: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Origen Default</Label>
                  <Input
                    value={isEditing ? formData[provider]?.defaultOrigin ?? courierConfig?.defaultOrigin ?? "" : courierConfig?.defaultOrigin ?? ""}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [provider]: { ...formData[provider], defaultOrigin: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={courierConfig?.marginPercent && courierConfig.marginPercent > 0 ? "default" : "destructive"}>
                  {courierConfig?.marginPercent && courierConfig.marginPercent > 0 ? `Margen ${courierConfig.marginPercent}%` : "Sin margen"}
                </Badge>
                {isEditing ? (
                  <>
                    <Button onClick={() => handleSave(provider)}>Guardar</Button>
                    <Button variant="outline" onClick={() => { setEditingId(null); setFormData({}) }}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setEditingId(provider)}>
                    Editar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function LocationsTab({ slug, locations }: { slug: string; locations: TenantLocation[] | undefined }) {
  const [search, setSearch] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<"shalom" | "olva">("shalom")

  const filteredLocations = locations?.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.department.toLowerCase().includes(search.toLowerCase()) ||
      loc.province?.toLowerCase().includes(search.toLowerCase())
  )

  const { data: agenciesData, isLoading: agenciesLoading } = useLocationAgencies(
    slug,
    selectedLocation || "",
    selectedProvider
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar ciudad..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ciudad</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Provincia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations?.map((loc) => (
                <TableRow
                  key={loc.name}
                  className="cursor-pointer"
                  onClick={() => setSelectedLocation(loc.name)}
                >
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell>{loc.department}</TableCell>
                  <TableCell>{loc.province}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
        <SheetContent side="right" className="w-[400px]">
          <SheetTrigger asChild>
            <div />
          </SheetTrigger>
          <div className="space-y-4 pt-4">
            <CardTitle>{selectedLocation}</CardTitle>
            <Tabs value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as "shalom" | "olva")}>
              <TabsList>
                <TabsTrigger value="shalom">Shalom</TabsTrigger>
                <TabsTrigger value="olva">Olva</TabsTrigger>
              </TabsList>
              <TabsContent value="shalom">
                {agenciesLoading ? (
                  <Skeleton className="h-32" />
                ) : agenciesData && "agencies" in agenciesData ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agencia</TableHead>
                        <TableHead>Código</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agenciesData.agencies.map((agency) => (
                        <TableRow key={agency.id}>
                          <TableCell>
                            {agency.name}
                            {agency.isDefault && <Badge className="ml-2">Default</Badge>}
                          </TableCell>
                          <TableCell className="font-mono">{agency.courierCode}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No hay agencias</p>
                )}
              </TabsContent>
              <TabsContent value="olva">
                {agenciesLoading ? (
                  <Skeleton className="h-32" />
                ) : agenciesData && "districts" in agenciesData ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Distrito</TableHead>
                          <TableHead>Código</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agenciesData.districts.map((district) => (
                          <TableRow key={district.id}>
                            <TableCell>{district.name}</TableCell>
                            <TableCell className="font-mono">{district.courierCode}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {agenciesData.pickupPoints.length > 0 && (
                      <>
                        <CardTitle className="mt-4">Puntos de Recojo</CardTitle>
                        <Table>
                          <TableBody>
                            {agenciesData.pickupPoints.map((point) => (
                              <TableRow key={point.id}>
                                <TableCell>{point.name}</TableCell>
                                <TableCell className="text-xs">{point.address}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No hay distritos</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ShipmentsTab() {
  const [orderId, setOrderId] = useState("")
  const { data: shipment, isLoading } = useShipmentByOrder(orderId)

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por externalOrderId..."
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading && <Skeleton className="h-32" />}

      {shipment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Envío {shipment.externalOrderId}
              <Badge>{shipment.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Provider</Label>
              <p className="font-medium">{shipment.provider}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Costo Courier</Label>
              <p className="font-medium">S/ {shipment.courierCost}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Costo Tenant</Label>
              <p className="font-medium">S/ {shipment.tenantCost}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Cliente</Label>
              <p className="font-medium">{shipment.customerName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Método</Label>
              <p className="font-medium">{shipment.deliveryMethod}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Fecha</Label>
              <p className="font-medium">{new Date(shipment.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function TenantsPage() {
  const { slug } = useParams<{ slug: string }>()
  const tenantSlug = slug || "lyrium"

  const { data: config, isLoading: configLoading } = useTenantConfig(tenantSlug)
  const { data: locations, isLoading: locationsLoading } = useTenantLocations(tenantSlug)

  return (
    <BaseLayout title={`Tenant: ${config?.tenant.name ?? slug}`} description="Configuración del tenant">
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="config" className="space-y-4">
          <TabsList>
            <TabsTrigger value="config">Config Couriers</TabsTrigger>
            <TabsTrigger value="ciudades">Ciudades</TabsTrigger>
            <TabsTrigger value="envios">Envíos</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            {configLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ConfigCouriersTab slug={tenantSlug} config={config} />
            )}
          </TabsContent>

          <TabsContent value="ciudades">
            {locationsLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <LocationsTab slug={tenantSlug} locations={locations} />
            )}
          </TabsContent>

          <TabsContent value="envios">
            <ShipmentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
