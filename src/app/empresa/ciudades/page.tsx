import { BaseLayout } from "@/components/layouts/base-layout"
import { useTenantLocations } from "@/hooks/useTenantLocations"
import { useLocationAgencies } from "@/hooks/useLocationAgencies"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import type { TenantLocation } from "@/types/logistics"

export default function EmpresaCiudadesPage() {
  const { user } = useAuth()
  const tenantSlug = user?.tenantSlug || "lyrium"

  const [search, setSearch] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<"shalom" | "olva">("shalom")

  const { data: locations, isLoading: locationsLoading } = useTenantLocations(tenantSlug)

  const filteredLocations = locations?.filter(
    (loc: TenantLocation) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.department.toLowerCase().includes(search.toLowerCase()) ||
      (loc.province?.toLowerCase() || '').includes(search.toLowerCase())
  )

  const { data: agenciesData, isLoading: agenciesLoading } = useLocationAgencies(
    tenantSlug,
    selectedLocation || "",
    selectedProvider
  )

  return (
    <BaseLayout title="Mis Ciudades" description={`Ciudades disponibles para ${user?.tenantName}`}>
      <div className="px-4 lg:px-6 space-y-4">
        <Input
          placeholder="Buscar ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        {locationsLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Provincia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations?.map((loc: TenantLocation) => (
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
        )}

        <Sheet open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
          <SheetContent side="right" className="w-[400px]">
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
    </BaseLayout>
  )
}
