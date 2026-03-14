import { useParams } from "react-router-dom"
import { BaseLayout } from "@/components/layouts/base-layout"
import { useCourierConfig } from "@/hooks/useCourierConfig"
import { useCourierDepartments } from "@/hooks/useCourierDepartments"
import { useCourierProvinces } from "@/hooks/useCourierProvinces"
import { useCourierAgencies } from "@/hooks/useCourierAgencies"
import { useCourierAgencySearch } from "@/hooks/useCourierAgencySearch"
import { useCourierQuote } from "@/hooks/useCourierQuote"
import { useCourierStats } from "@/hooks/useCourierStats"
import { useCourierLocations } from "@/hooks/useCourierLocations"
import { useOlvaCoverage } from "@/hooks/useOlvaCoverage"
import { useSyncAgencies } from "@/hooks/useSyncAgencies"
import { COURIERS } from "@/types/logistics"
import { MERCHANDISE_INFO, type QuoteRequest, type QuoteResponse, type CourierAgency } from "@/types/courier"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Calculator, RefreshCw, MapPin, Clock, ChevronRight, Package, Activity, Globe } from "lucide-react"

function ResumenTab({ provider }: { provider: string }) {
  const { data: config } = useCourierConfig(provider)
  const { data: stats, isLoading: statsLoading } = useCourierStats()
  const { data: agencies } = useCourierAgencies(provider, "")
  const { data: departments } = useCourierDepartments(provider)
  const info = COURIERS[provider]

  const activeAgencies = agencies?.filter((a) => a.isActive).length ?? 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            <Badge variant={info?.status === "implemented" ? "default" : "secondary"}>
              {info?.status === "implemented" ? "Activo" : "En desarrollo"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{info?.name}</div>
            <p className="text-xs text-muted-foreground">{info?.format}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agencias Activas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgencies}</div>
            <p className="text-xs text-muted-foreground">Registradas en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Con cobertura</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pool de Browsers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.browserPool.active ?? 0}/{stats?.browserPool.maxConcurrent ?? 5}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.browserPool.queued ?? 0} en cola
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Configuración de Origen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Origen por defecto</Label>
                  <p className="font-mono">{config.defaultOrigin}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Etiqueta</Label>
                  <p>{config.defaultOriginLabel}</p>
                </div>
              </div>
              {config.originInfo && (
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {config.originInfo.agencyName && (
                      <div>
                        <span className="text-muted-foreground">Agencia:</span> {config.originInfo.agencyName}
                      </div>
                    )}
                    {config.originInfo.address && (
                      <div>
                        <span className="text-muted-foreground">Dirección:</span> {config.originInfo.address}
                      </div>
                    )}
                    {config.originInfo.department && (
                      <div>
                        <span className="text-muted-foreground">Depto:</span> {config.originInfo.department}
                      </div>
                    )}
                    {config.originInfo.schedule && (
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1 mb-1"><Clock className="h-3 w-3" /> Horario:</span>
                        {typeof config.originInfo.schedule === "string" ? (
                          <span>{config.originInfo.schedule}</span>
                        ) : (
                          <div className="text-xs space-y-0.5">
                            {Object.entries(config.originInfo.schedule).map(([day, hours]) => (
                              <div key={day}><span className="font-medium">{day}:</span> {String(hours)}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Cargando configuración...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pasos para Cotizar</CardTitle>
          <CardDescription>Cómo construir origen y destino para este courier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-medium">Origen</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {config.originSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Badge variant="outline" className="font-mono text-xs">{step.endpoint}</Badge>
                      {i < config.originSteps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{config.buildOrigin}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Destino</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {config.destinationSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Badge variant="outline" className="font-mono text-xs">{step.endpoint}</Badge>
                      {i < config.destinationSteps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{config.buildDestination}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AgenciesTab({ provider }: { provider: string }) {
  const [selectedDept, setSelectedDept] = useState<string>("")
  const [selectedProvince, setSelectedProvince] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAgency, setSelectedAgency] = useState<CourierAgency | null>(null)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)

  const { data: departments } = useCourierDepartments(provider)
  const { data: provinces } = useCourierProvinces(provider, selectedDept)
  const { data: agencies, isLoading: agenciesLoading, refetch: refetchAgencies } = useCourierAgencies(provider, selectedDept, selectedProvince)
  const { data: searchResults } = useCourierAgencySearch(provider, searchQuery)
  const syncMutation = useSyncAgencies(provider)

  console.log('[AgenciesTab] syncMutation state:', {
    isPending: syncMutation.isPending,
    isError: syncMutation.isError,
    isSuccess: syncMutation.isSuccess,
    error: syncMutation.error,
  })

  useEffect(() => {
    if (departments && departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0].name)
    }
  }, [departments, selectedDept])

  const displayAgencies = searchQuery.length >= 2 ? searchResults : agencies
  const activeAgencies = displayAgencies?.filter((a) => a.isActive) ?? []
  const uniqueDepts = [...new Set(displayAgencies?.map((a) => String(a.metadata?.department ?? a.metadata?.departamento ?? "-")).filter(Boolean))]
  const uniqueProvinces = [...new Set(displayAgencies?.map((a) => String(a.metadata?.province ?? a.metadata?.provincia ?? "-")).filter(Boolean))]

  const handleSync = async () => {
    setSyncDialogOpen(false)
    try {
      const result = await syncMutation.mutateAsync()
      toast.success(`Sincronización completada: ${result.scraped} scraped, ${result.created} creadas, ${result.updated} actualizadas (${result.duration})`)
      await refetchAgencies()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al sincronizar agencias'
      toast.error(message)
    }
  }

  const getDept = (agency: CourierAgency) => String(agency.metadata?.department ?? agency.metadata?.departamento ?? "-")
  const getProvince = (agency: CourierAgency) => String(agency.metadata?.province ?? agency.metadata?.provincia ?? "-")

  return (
    <div className="space-y-4">
      {syncMutation.isPending && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardContent className="py-3 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Sincronizando agencias desde la web de {provider}...</span>
          </CardContent>
        </Card>
      )}

      {syncMutation.isError && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="py-3">
            <p className="text-red-600 dark:text-red-400">Error: {syncMutation.error?.message}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar agencias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
          <Button variant="outline" onClick={() => setSyncDialogOpen(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar sincronización</DialogTitle>
              <DialogDescription>
                Esta acción sincronizará las agencias desde la web del courier.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSync} disabled={syncMutation.isPending}>
                {syncMutation.isPending ? "Sincronizando..." : "Sincronizar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{activeAgencies.length}</div>
            <div className="text-sm text-muted-foreground">Agencias Activas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{uniqueDepts.length}</div>
            <div className="text-sm text-muted-foreground">Departamentos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{uniqueProvinces.length}</div>
            <div className="text-sm text-muted-foreground">Provincias</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Select value={selectedDept} onValueChange={(v) => { setSelectedDept(v); setSelectedProvince("") }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            {departments?.map((dept) => (
              <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedProvince} onValueChange={setSelectedProvince} disabled={!selectedDept}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Provincia" />
          </SelectTrigger>
          <SelectContent>
            {provinces?.map((prov) => (
              <SelectItem key={prov.name} value={prov.name}>{prov.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(selectedDept || selectedProvince) && (
          <Button variant="ghost" onClick={() => { setSelectedDept(""); setSelectedProvince("") }}>
            Limpiar
          </Button>
        )}
      </div>

      {agenciesLoading ? (
        <Skeleton className="h-64" />
      ) : displayAgencies && displayAgencies.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Depto</TableHead>
                  <TableHead>Provincia</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayAgencies?.map((agency) => (
                  <TableRow key={agency.id} className="cursor-pointer" onClick={() => setSelectedAgency(agency)}>
                    <TableCell className="font-medium">{agency.name}</TableCell>
                    <TableCell className="text-sm">{agency.address || "-"}</TableCell>
                    <TableCell>{getDept(agency)}</TableCell>
                    <TableCell>{getProvince(agency)}</TableCell>
                    <TableCell>
                      {agency.pointType && <Badge variant="outline">{agency.pointType}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={agency.isActive ? "default" : "destructive"}>
                        {agency.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 text-center text-muted-foreground">
            No se encontraron agencias.
          </CardContent>
        </Card>
      )}

      <Sheet open={!!selectedAgency} onOpenChange={(open) => !open && setSelectedAgency(null)}>
        <SheetContent side="right" className="w-[400px]">
          <SheetHeader>
            <SheetTitle>{selectedAgency?.name as string}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-muted-foreground">Dirección</Label>
              <p>{selectedAgency?.address as string || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Código</Label>
              <p className="font-mono">{selectedAgency?.locationCode as string || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Coordenadas</Label>
              <p className="font-mono text-sm">
                {selectedAgency?.latitude as string}, {selectedAgency?.longitude as string}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Metadata</Label>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(selectedAgency?.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function OlvaCoberturaTab({ provider }: { provider: string }) {
  const [selectedDept, setSelectedDept] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const { data: coverage, isLoading } = useOlvaCoverage(selectedDept || undefined)
  const { data: departments } = useCourierDepartments(provider)

  // Flatten all districts for counting & searching
  const allDistricts = coverage?.flatMap(d =>
    d.provinces.flatMap(p =>
      p.districts.map(dist => ({
        ...dist,
        department: d.department,
        province: p.province,
      }))
    )
  ) ?? []

  const filteredDistricts = searchQuery.length >= 2
    ? allDistricts.filter(d =>
        d.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.ubigeo.includes(searchQuery) ||
        d.quoteFormat.includes(searchQuery)
      )
    : null

  const totalDistricts = allDistricts.length
  const totalProvinces = coverage?.reduce((sum, d) => sum + d.provinces.length, 0) ?? 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{departments?.length ?? 0}</div>
            <div className="text-sm text-muted-foreground">Departamentos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalProvinces}</div>
            <div className="text-sm text-muted-foreground">Provincias{selectedDept ? ` en ${selectedDept}` : ""}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalDistricts}</div>
            <div className="text-sm text-muted-foreground">Distritos con cobertura</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todos los departamentos" />
          </SelectTrigger>
          <SelectContent>
            {departments?.map((dept) => (
              <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Buscar distrito, provincia o ubigeo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        {(selectedDept || searchQuery) && (
          <Button variant="ghost" onClick={() => { setSelectedDept(""); setSearchQuery("") }}>
            Limpiar
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : filteredDistricts ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resultados de busqueda ({filteredDistricts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Provincia</TableHead>
                  <TableHead>Distrito</TableHead>
                  <TableHead>Ubigeo</TableHead>
                  <TableHead>Formato Cotizacion</TableHead>
                  <TableHead>Agencias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistricts.map((d) => (
                  <TableRow key={d.ubigeo}>
                    <TableCell>{d.department}</TableCell>
                    <TableCell>{d.province}</TableCell>
                    <TableCell className="font-medium">{d.district}</TableCell>
                    <TableCell className="font-mono text-sm">{d.ubigeo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{d.quoteFormat}</Badge>
                    </TableCell>
                    <TableCell>{d.agencyCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : coverage && coverage.length > 0 ? (
        <div className="space-y-4">
          {coverage.map((dept) => (
            <Card key={dept.department}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {dept.department}
                  <Badge variant="secondary">
                    {dept.provinces.reduce((s, p) => s + p.districts.length, 0)} distritos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {dept.provinces.map((prov) => (
                  <div key={prov.province}>
                    <div className="px-6 py-2 bg-muted/50 text-sm font-medium border-t">
                      {prov.province} ({prov.districts.length})
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Distrito</TableHead>
                          <TableHead>Ubigeo</TableHead>
                          <TableHead>Formato Cotizacion</TableHead>
                          <TableHead>Agencias</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prov.districts.map((dist) => (
                          <TableRow key={dist.ubigeo}>
                            <TableCell className="font-medium">{dist.district}</TableCell>
                            <TableCell className="font-mono text-sm">{dist.ubigeo}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">{dist.quoteFormat}</Badge>
                            </TableCell>
                            <TableCell>{dist.agencyCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-4 text-center text-muted-foreground">
            No se encontraron ubicaciones.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ubigeo para cotizacion</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Olva usa ubigeo INEI para cotizar: <span className="font-mono">DD/DDPP/DDPPDD</span></p>
          <p>Ejemplo: Lima - Lima - Lima = <span className="font-mono">15/1501/150101</span></p>
          <p>Ejemplo: Arequipa - Arequipa - Arequipa = <span className="font-mono">04/0401/040101</span></p>
        </CardContent>
      </Card>
    </div>
  )
}

function GenericUbicacionesTab({ provider }: { provider: string }) {
  const [level, setLevel] = useState<"departamento" | "provincia" | "distrito">("departamento")
  const [selectedDept, setSelectedDept] = useState<string>("")
  const [selectedProvince, setSelectedProvince] = useState<string>("")

  const { data: departments, isLoading: deptsLoading } = useCourierLocations(provider, "departamento")
  const { data: provinces, isLoading: provsLoading } = useCourierLocations(provider, "provincia", selectedDept)
  const { data: districts, isLoading: distsLoading } = useCourierLocations(provider, "distrito", selectedProvince)

  const items = level === "departamento" ? departments : level === "provincia" ? provinces : districts
  const isLoading = level === "departamento" ? deptsLoading : level === "provincia" ? provsLoading : distsLoading

  const currentParents = [
    { value: selectedDept, label: "Departamento", onChange: (v: string) => { setSelectedDept(v); setSelectedProvince("") }, options: departments },
    { value: selectedProvince, label: "Provincia", onChange: setSelectedProvince, options: provinces, disabled: !selectedDept },
  ].filter(() => level !== "departamento")

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={level === "departamento" ? "default" : "outline"}
          size="sm"
          onClick={() => { setLevel("departamento"); setSelectedDept(""); setSelectedProvince("") }}
        >
          Departamentos
        </Button>
        <Button
          variant={level === "provincia" ? "default" : "outline"}
          size="sm"
          onClick={() => setLevel("provincia")}
          disabled={!selectedDept}
        >
          Provincias
        </Button>
        <Button
          variant={level === "distrito" ? "default" : "outline"}
          size="sm"
          onClick={() => setLevel("distrito")}
          disabled={!selectedProvince}
        >
          Distritos
        </Button>
      </div>

      {currentParents.map((parent) => (
        <Select key={parent.label} value={parent.value} onValueChange={parent.onChange} disabled={parent.disabled}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={`Seleccionar ${parent.label}`} />
          </SelectTrigger>
          <SelectContent>
            {parent.options?.map((item: { code: string; name: string }) => (
              <SelectItem key={item.code} value={item.code}>{item.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : items && items.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: { code: string; name: string }) => (
                  <TableRow key={item.code}>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{level}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 text-center text-muted-foreground">
            No se encontraron ubicaciones.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informacion</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Jerarquia: Departamento → Provincia → Distrito</p>
          <p>Selecciona un nivel para ver las ubicaciones disponibles.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function TestTab({ provider }: { provider: string }) {
  const [form, setForm] = useState<QuoteRequest>({
    origin: "",
    destination: "",
    weight: 1,
  })
  const [result, setResult] = useState<QuoteResponse | null>(null)
  const quoteMutation = useCourierQuote(provider)

  const merchandiseInfo = MERCHANDISE_INFO[provider]
  const selectedMerchandise = merchandiseInfo?.types.find((t) => t.value === form.merchandiseType)

  const handleQuote = async () => {
    try {
      const data = await quoteMutation.mutateAsync(form)
      setResult(data)
    } catch {
      toast.error("Error al cotizar")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Prueba de Cotización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Origen</Label>
              <Input
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                placeholder="Ej: LIMA"
              />
            </div>
            <div>
              <Label>Destino</Label>
              <Input
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="Ej: AREQUIPA"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Tipo de Mercadería</Label>
              <Select
                value={form.merchandiseType}
                onValueChange={(v) => setForm({ ...form, merchandiseType: v as QuoteRequest["merchandiseType"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {merchandiseInfo?.types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedMerchandise?.packageSizes && (
            <div>
              <Label>Talla</Label>
              <Select
                value={form.packageSize}
                onValueChange={(v) => setForm({ ...form, packageSize: v as QuoteRequest["packageSize"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar talla" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMerchandise.packageSizes.map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {selectedMerchandise?.requiresDimensions && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Largo (cm)</Label>
                <Input
                  type="number"
                  value={form.length || ""}
                  onChange={(e) => setForm({ ...form, length: parseInt(e.target.value) || undefined })}
                  placeholder="20"
                />
              </div>
              <div>
                <Label>Ancho (cm)</Label>
                <Input
                  type="number"
                  value={form.width || ""}
                  onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) || undefined })}
                  placeholder="15"
                />
              </div>
              <div>
                <Label>Alto (cm)</Label>
                <Input
                  type="number"
                  value={form.height || ""}
                  onChange={(e) => setForm({ ...form, height: parseInt(e.target.value) || undefined })}
                  placeholder="10"
                />
              </div>
            </div>
          )}
          <Button onClick={handleQuote} disabled={quoteMutation.isPending}>
            {quoteMutation.isPending ? "Cotizando..." : "Cotizar"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            {result.services.map((service, i) => (
              <div key={i} className="flex justify-between items-center p-3 border-b last:border-0">
                <div>
                  <div className="font-medium">{service.serviceType}</div>
                  {service.transitDays && (
                    <div className="text-sm text-muted-foreground">{service.transitDays} días</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{service.currency} {service.price}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function CouriersPage() {
  const { provider } = useParams<{ provider: string }>()

  if (!provider || !COURIERS[provider]) {
    return (
      <BaseLayout title="Courier no encontrado">
        <div className="px-4 lg:px-6">
          <p>El courier "{provider}" no existe.</p>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout title={`Courier: ${COURIERS[provider].name}`} description={`Detalles de ${COURIERS[provider].name}`}>
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="resumen" className="space-y-4">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="agencies">Agencias</TabsTrigger>
            <TabsTrigger value="ubicaciones">{provider === "olva" ? "Cobertura / Ubigeos" : "Ubicaciones"}</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen">
            <ResumenTab provider={provider} />
          </TabsContent>

          <TabsContent value="agencies">
            <AgenciesTab provider={provider} />
          </TabsContent>

          <TabsContent value="ubicaciones">
            {provider === "olva" ? (
              <OlvaCoberturaTab provider={provider} />
            ) : (
              <GenericUbicacionesTab provider={provider} />
            )}
          </TabsContent>

          <TabsContent value="test">
            <TestTab provider={provider} />
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
