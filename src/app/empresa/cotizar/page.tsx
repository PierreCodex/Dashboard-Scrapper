import { BaseLayout } from "@/components/layouts/base-layout"
import { DestinationCombobox } from "@/components/destination-combobox"
import { OriginCombobox } from "@/components/origin-combobox"
import { useTenantLocations } from "@/hooks/useTenantLocations"
import { useTenantConfig } from "@/hooks/useTenantConfig"
import { useCalculateShipping } from "@/hooks/useCalculateShipping"
import { useUpdateCourierConfig } from "@/hooks/useUpdateCourierConfig"
import { useLocationAgencies } from "@/hooks/useLocationAgencies"
import { useCourierOrigins } from "@/hooks/useCourierOrigins"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { useState, useMemo } from "react"
import { estimateBox } from "@/lib/bin-packing"
import { Calculator, Plus, Trash2, TrendingDown, AlertTriangle, Percent, Save, Eye, EyeOff, MapPin, Building2, Package, Weight, Ruler, Copy, Store, ArrowRightLeft, Box } from "lucide-react"
import { toast } from "sonner"

// ─── Category config ───────────────────────────────────────
const INTERPROV_PROVIDERS = ["shalom", "olva"]
const LOCAL_PROVIDERS = ["urbano", "scharff"]
const VOLUMETRIC_FACTOR = 5000

// ─── Shared types ──────────────────────────────────────────
interface ItemRow {
  id: string
  weightKg: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  quantity: number
}

interface ShippingOption {
  provider: string
  serviceType: string
  courierCost: number
  tenantCost: number
  currency: string
  breakdown: {
    totalWeightKg: number
    volumetricWeightKg: number
    chargeableWeightKg: number
    boxLengthCm?: number
    boxWidthCm?: number
    boxHeightCm?: number
    packingEfficiency?: number
  }
}

interface ShippingResult {
  options: ShippingOption[]
  skippedProviders: Array<{ provider: string; reason: string }>
}

// ─── Box estimate preview ─────────────────────────────────
function BoxEstimate({ items }: { items: ItemRow[] }) {
  const estimate = useMemo(() => {
    const packingItems = items
      .filter((i) => i.lengthCm && i.widthCm && i.heightCm && i.weightKg > 0)
      .map((i) => ({
        length: i.lengthCm!,
        width: i.widthCm!,
        height: i.heightCm!,
        weight: i.weightKg,
        quantity: i.quantity,
      }))
    if (packingItems.length === 0) return null
    return estimateBox(packingItems)
  }, [items])

  if (!estimate || estimate.boxVolume === 0) return null

  const volWeight = (estimate.length * estimate.width * estimate.height) / VOLUMETRIC_FACTOR
  const chargeableWeight = Math.max(Math.ceil(Math.max(estimate.totalWeight, volWeight)), 1)

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
      <Box className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div className="space-y-1 text-xs">
        <div className="font-medium text-sm">Caja estimada</div>
        <div className="flex gap-4 flex-wrap">
          <span>{estimate.length} x {estimate.width} x {estimate.height} cm</span>
          <span className="text-muted-foreground">Eficiencia: {estimate.efficiency}%</span>
        </div>
        <div className="flex gap-4 flex-wrap text-muted-foreground">
          <span>Peso real: {estimate.totalWeight.toFixed(1)} kg</span>
          <span>Peso vol.: {volWeight.toFixed(1)} kg</span>
          <span className="font-medium text-foreground">Facturable: {chargeableWeight} kg</span>
        </div>
      </div>
    </div>
  )
}

// ─── Items table ───────────────────────────────────────────
function ItemsTable({
  items,
  onUpdate,
  onAdd,
  onRemove,
  onDuplicate,
}: {
  items: ItemRow[]
  onUpdate: (id: string, field: keyof ItemRow, value: number) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  const totalWeight = items.reduce((sum, item) => sum + item.weightKg * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="border rounded-lg p-3 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(item.id)} title="Duplicar">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove(item.id)} disabled={items.length <= 1} title="Eliminar">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1 mb-1">
                <Weight className="h-3 w-3" /> Peso (kg)
              </Label>
              <Input type="number" step="0.1" min="0.1" value={item.weightKg} onChange={(e) => onUpdate(item.id, "weightKg", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1 mb-1">
                <Ruler className="h-3 w-3" /> Largo (cm)
              </Label>
              <Input type="number" min="1" value={item.lengthCm || ""} onChange={(e) => onUpdate(item.id, "lengthCm", parseInt(e.target.value) || 0)} placeholder="20" />
            </div>
            <div>
              <Label className="text-xs mb-1">Ancho (cm)</Label>
              <Input type="number" min="1" value={item.widthCm || ""} onChange={(e) => onUpdate(item.id, "widthCm", parseInt(e.target.value) || 0)} placeholder="15" />
            </div>
            <div>
              <Label className="text-xs mb-1">Alto (cm)</Label>
              <Input type="number" min="1" value={item.heightCm || ""} onChange={(e) => onUpdate(item.id, "heightCm", parseInt(e.target.value) || 0)} placeholder="10" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1 mb-1">
                <Package className="h-3 w-3" /> Cantidad
              </Label>
              <Input type="number" min="1" value={item.quantity} onChange={(e) => onUpdate(item.id, "quantity", parseInt(e.target.value) || 1)} />
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Agregar item
        </Button>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{totalItems} {totalItems === 1 ? "unidad" : "unidades"}</span>
          <span>{totalWeight.toFixed(1)} kg total</span>
        </div>
      </div>
    </div>
  )
}

// ─── Result cards for a category ───────────────────────────
function CategoryResults({
  result,
  showCostBreakdown,
  simulatedMargin,
  configMargins,
  isLoading,
}: {
  result: ShippingResult | null
  showCostBreakdown: boolean
  simulatedMargin: number | null
  configMargins: Record<string, number>
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <Calculator className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-sm animate-pulse">Cotizando...</span>
      </div>
    )
  }

  if (!result) return null

  const getDisplayCost = (option: ShippingOption) => {
    if (simulatedMargin !== null) {
      return Math.round(option.courierCost * (1 + simulatedMargin / 100) * 100) / 100
    }
    return option.tenantCost
  }

  const sorted = [...result.options].sort((a, b) => getDisplayCost(a) - getDisplayCost(b))

  if (sorted.length === 0 && result.skippedProviders.length > 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        Sin cobertura para este destino
      </div>
    )
  }

  if (sorted.length === 0) return null

  return (
    <div className="space-y-3 mt-4">
      {sorted.map((option, index) => {
        const displayCost = getDisplayCost(option)
        const activeMargin = simulatedMargin ?? (configMargins[option.provider] ?? 5)
        const marginAmount = displayCost - option.courierCost

        return (
          <Card key={`${option.provider}-${option.serviceType}`} className={index === 0 && sorted.length > 1 ? "border-green-500/50" : ""}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium capitalize">{option.provider}</span>
                    <Badge variant="outline" className="text-xs">{option.serviceType}</Badge>
                    {index === 0 && sorted.length > 1 && (
                      <Badge className="bg-green-500 text-xs">
                        <TrendingDown className="h-3 w-3 mr-1" /> Mas barato
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.breakdown.chargeableWeightKg} kg facturable
                    {option.breakdown.boxLengthCm && (
                      <> · {option.breakdown.boxLengthCm}x{option.breakdown.boxWidthCm}x{option.breakdown.boxHeightCm} cm</>
                    )}
                  </div>
                  {showCostBreakdown && (
                    <div className="text-xs space-y-0.5 mt-2 bg-muted/50 rounded p-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Courier:</span>
                        <span className="font-mono">{option.currency} {option.courierCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margen ({activeMargin}%):</span>
                        <span className="font-mono text-green-600">+{option.currency} {marginAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold">{option.currency} {displayCost.toFixed(2)}</div>
                  {simulatedMargin !== null && simulatedMargin !== (configMargins[option.provider] ?? 5) && (
                    <div className="text-[10px] text-blue-500">Simulando {simulatedMargin}%</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {result.skippedProviders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
          {result.skippedProviders.map((sp) => (
            <span key={sp.provider}><span className="capitalize font-medium">{sp.provider}</span>: sin cobertura</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────
export default function EmpresaCotizarPage() {
  const { user } = useAuth()
  const tenantSlug = user?.tenantSlug || "lyrium"
  const tenantId = user?.tenantId || ""

  const { data: config } = useTenantConfig(tenantSlug)
  const { data: shalomLocations, isLoading: shalomLocsLoading } = useTenantLocations(tenantSlug, "shalom")
  const { data: olvaLocations, isLoading: olvaLocsLoading } = useTenantLocations(tenantSlug, "olva")
  const { data: urbanoLocations, isLoading: urbanoLocsLoading } = useTenantLocations(tenantSlug, "urbano")
  const { data: scharffLocations, isLoading: scharffLocsLoading } = useTenantLocations(tenantSlug, "scharff")
  
  // Origins for each courier
  const { data: shalomOrigins } = useCourierOrigins("shalom")
  const { data: olvaOrigins } = useCourierOrigins("olva")
  
  const shalomMutation = useCalculateShipping()
  const olvaMutation = useCalculateShipping()
  const compareMutation = useCalculateShipping()
  const urbanoMutation = useCalculateShipping()
  const scharffMutation = useCalculateShipping()
  const updateConfigMutation = useUpdateCourierConfig()

  const activeCouriers = config?.configs.filter((c) => c.isActive) || []
  const configMargins: Record<string, number> = {}
  activeCouriers.forEach((c) => { configMargins[c.provider] = c.marginPercent })

  const interprovCouriers = activeCouriers.filter((c) => INTERPROV_PROVIDERS.includes(c.provider))
  const localCouriers = activeCouriers.filter((c) => LOCAL_PROVIDERS.includes(c.provider))
  const hasShalom = interprovCouriers.some((c) => c.provider === "shalom")
  const hasOlva = interprovCouriers.some((c) => c.provider === "olva")

  // Merge interprovincial locations (shalom + olva), deduplicated by name
  const interprovLocations = useMemo(() => {
    const map = new Map<string, { name: string; department: string }>()
    for (const loc of (shalomLocations || [])) map.set(loc.name, loc)
    for (const loc of (olvaLocations || [])) map.set(loc.name, loc)
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [shalomLocations, olvaLocations])
  const locationsLoading = shalomLocsLoading || olvaLocsLoading

  // State
  const [interprovDest, setInterprovDest] = useState("")
  const [shalomAgencyOverride, setShalomAgencyOverride] = useState("")
  const [urbanoDest, setUrbanoDest] = useState("")
  const [scharffDest, setScharffDest] = useState("")
  
  // Selected origins per courier (defaults to config's defaultOrigin)
  const [selectedOrigins, setSelectedOrigins] = useState<Record<string, string>>({})
  
  // Initialize selected origins from config
  useMemo(() => {
    const origins: Record<string, string> = {}
    activeCouriers.forEach((c) => {
      if (c.defaultOrigin && !origins[c.provider]) {
        origins[c.provider] = c.defaultOrigin
      }
    })
    setSelectedOrigins(origins)
  }, [config])
  const [items, setItems] = useState<ItemRow[]>([
    { id: "1", weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10, quantity: 1 },
  ])
  const [shalomResult, setShalomResult] = useState<ShippingResult | null>(null)
  const [olvaResult, setOlvaResult] = useState<ShippingResult | null>(null)
  const [compareResult, setCompareResult] = useState<ShippingResult | null>(null)
  const [urbanoResult, setUrbanoResult] = useState<ShippingResult | null>(null)
  const [scharffResult, setScharffResult] = useState<ShippingResult | null>(null)
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [simulatedMargin, setSimulatedMargin] = useState<number | null>(null)
  const [marginInput, setMarginInput] = useState("")
  const [originModalOpen, setOriginModalOpen] = useState(false)
  const [originModalProvider, setOriginModalProvider] = useState<string | null>(null)

  // Fetch Shalom agencies only when Shalom is active AND a destination is selected
  const { data: shalomAgencies, isLoading: agenciesLoading } = useLocationAgencies(
    tenantSlug, hasShalom ? interprovDest : "", "shalom"
  )

  const handleAddItem = () => {
    setItems([...items, { id: String(Date.now()), weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10, quantity: 1 }])
  }
  const handleRemoveItem = (id: string) => {
    if (items.length > 1) setItems(items.filter((item) => item.id !== id))
  }
  const handleDuplicateItem = (id: string) => {
    const source = items.find((item) => item.id === id)
    if (source) setItems([...items, { ...source, id: String(Date.now()) }])
  }
  const handleUpdateItem = (id: string, field: keyof ItemRow, value: number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const buildRequest = (destination: string, providers: string[], agencyOverrides?: Record<string, string>) => {
    const origin = selectedOrigins[providers[0]] || selectedOrigins[providers[0]] || undefined
    return {
      tenantId,
      destination,
      origin,
      items: items.map(({ id, ...item }) => item),
      providers,
      ...(agencyOverrides && Object.keys(agencyOverrides).length > 0 ? { agencyOverrides } : {}),
    }
  }

  const shalomOverrides = () => shalomAgencyOverride ? { shalom: shalomAgencyOverride } : undefined

  const handleShalomQuote = async () => {
    try {
      const data = await shalomMutation.mutateAsync(buildRequest(interprovDest, ["shalom"], shalomOverrides()))
      setShalomResult(data)
    } catch {
      toast.error("Error al cotizar con Shalom")
      setShalomResult(null)
    }
  }

  const handleOlvaQuote = async () => {
    try {
      const data = await olvaMutation.mutateAsync(buildRequest(interprovDest, ["olva"]))
      setOlvaResult(data)
    } catch {
      toast.error("Error al cotizar con Olva")
      setOlvaResult(null)
    }
  }

  const handleCompare = async () => {
    try {
      const data = await compareMutation.mutateAsync(
        buildRequest(interprovDest, interprovCouriers.map((c) => c.provider), shalomOverrides())
      )
      setCompareResult(data)
    } catch {
      toast.error("Error al comparar precios")
      setCompareResult(null)
    }
  }

  const handleUrbanoQuote = async () => {
    try {
      const data = await urbanoMutation.mutateAsync(buildRequest(urbanoDest, ["urbano"]))
      setUrbanoResult(data)
    } catch {
      toast.error("Error al cotizar con Urbano")
      setUrbanoResult(null)
    }
  }

  const handleScharffQuote = async () => {
    try {
      const data = await scharffMutation.mutateAsync(buildRequest(scharffDest, ["scharff"]))
      setScharffResult(data)
    } catch {
      toast.error("Error al cotizar con Scharff")
      setScharffResult(null)
    }
  }

  const handleSimulateMargin = () => {
    const value = parseFloat(marginInput)
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error("Ingresa un margen valido (0-100)")
      return
    }
    setSimulatedMargin(value)
  }
  const handleResetMargin = () => { setSimulatedMargin(null); setMarginInput("") }
  const handleSaveMargin = async () => {
    if (simulatedMargin === null) return
    try {
      await Promise.all(
        activeCouriers.map((c) =>
          updateConfigMutation.mutateAsync({ slug: tenantSlug, provider: c.provider, marginPercent: simulatedMargin })
        )
      )
      toast.success(`Margen actualizado a ${simulatedMargin}% para todos los couriers`)
      setSimulatedMargin(null); setMarginInput("")
    } catch { toast.error("Error al guardar el margen") }
  }

  const resetInterprovResults = () => { setShalomResult(null); setOlvaResult(null); setCompareResult(null) }

  const hasResults = shalomResult || olvaResult || compareResult || urbanoResult || scharffResult

  return (
    <BaseLayout title="Cotizar Envio" description={`Calcula costos de envio para ${user?.tenantName}`}>
      <div className="px-4 lg:px-6 space-y-6">

        {/* ─── Package / Items + Box Estimate ────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> Paquete
            </CardTitle>
            <CardDescription>Peso y dimensiones de los items a enviar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ItemsTable items={items} onUpdate={handleUpdateItem} onAdd={handleAddItem} onRemove={handleRemoveItem} onDuplicate={handleDuplicateItem} />
            <BoxEstimate items={items} />
          </CardContent>
        </Card>

        {/* ─── Two columns: Interprov + Local ───────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* ── Interprovincial ──────────────────────────────── */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-blue-500" />
                Envios Interprovinciales
              </CardTitle>
              <CardDescription>Cobertura nacional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {interprovCouriers.length === 0 ? (
                <p className="text-sm text-yellow-600">No hay couriers interprovinciales activos</p>
              ) : (
                <>
                  {/* Shared destination */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ciudad destino</Label>
                    {locationsLoading ? (
                      <Skeleton className="h-10 mt-1" />
                    ) : interprovLocations.length > 0 ? (
                      <DestinationCombobox
                        destinations={interprovLocations}
                        value={interprovDest}
                        onValueChange={(v) => { setInterprovDest(v); resetInterprovResults(); setShalomAgencyOverride("") }}
                        placeholder="Buscar ciudad..."
                      />
                    ) : (
                      <p className="text-sm text-yellow-600 mt-1">No hay destinos configurados</p>
                    )}
                  </div>

                  {/* ── Shalom section ─────────────────────── */}
                  {hasShalom && shalomOrigins && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize gap-1">
                            Shalom <span className="text-[10px] opacity-70">({configMargins["shalom"] ?? 5}%)</span>
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">Agencia → Agencia</span>
                        </div>
                        <Dialog open={originModalOpen && originModalProvider === "shalom"} onOpenChange={(open) => { setOriginModalOpen(open); setOriginModalProvider(open ? "shalom" : null) }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground">
                              <MapPin className="h-3 w-3 mr-1" /> {selectedOrigins["shalom"] || "Cambiar origen"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cambiar origen - Shalom</DialogTitle>
                              <DialogDescription>Selecciona la ciudad de origen para Shalom</DialogDescription>
                            </DialogHeader>
                            <OriginCombobox
                              origins={shalomOrigins}
                              value={selectedOrigins["shalom"] || ""}
                              onValueChange={(v) => { setSelectedOrigins(prev => ({ ...prev, shalom: v })); setOriginModalOpen(false) }}
                              placeholder="Seleccionar origen..."
                            />
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Agency selector */}
                      {interprovDest && (
                        <div>
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Store className="h-3 w-3" /> Agencia destino
                          </Label>
                          {agenciesLoading ? (
                            <Skeleton className="h-9 mt-1" />
                          ) : shalomAgencies?.type === "agencies" && shalomAgencies.agencies.length > 0 ? (
                            <Select
                              value={shalomAgencyOverride || "default"}
                              onValueChange={(v) => { setShalomAgencyOverride(v === "default" ? "" : v); resetInterprovResults() }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">
                                  {shalomAgencies.defaultCourierCode} (default)
                                </SelectItem>
                                {shalomAgencies.agencies
                                  .filter((a) => !a.isDefault)
                                  .map((agency) => (
                                    <SelectItem key={agency.id} value={agency.courierCode}>
                                      {agency.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">Sin agencias para este destino</p>
                          )}
                          {shalomAgencies?.type === "agencies" && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {shalomAgencies.agencies.length} agencias en {interprovDest}
                            </p>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={handleShalomQuote}
                        disabled={!interprovDest || shalomMutation.isPending}
                        className="w-full"
                        variant="outline"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        {shalomMutation.isPending ? "Cotizando..." : "Cotizar Shalom"}
                      </Button>

                      <CategoryResults
                        result={shalomResult}
                        showCostBreakdown={showCostBreakdown}
                        simulatedMargin={simulatedMargin}
                        configMargins={configMargins}
                        isLoading={shalomMutation.isPending}
                      />
                    </div>
                  )}

                  {hasShalom && hasOlva && <Separator />}

                  {/* ── Olva section ───────────────────────── */}
                  {hasOlva && olvaOrigins && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize gap-1">
                            Olva <span className="text-[10px] opacity-70">({configMargins["olva"] ?? 5}%)</span>
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">Ubigeo origen → destino</span>
                        </div>
                        <Dialog open={originModalOpen && originModalProvider === "olva"} onOpenChange={(open) => { setOriginModalOpen(open); setOriginModalProvider(open ? "olva" : null) }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground">
                              <MapPin className="h-3 w-3 mr-1" /> {selectedOrigins["olva"] || "Cambiar origen"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cambiar origen - Olva</DialogTitle>
                              <DialogDescription>Selecciona la ciudad de origen para Olva</DialogDescription>
                            </DialogHeader>
                            <OriginCombobox
                              origins={olvaOrigins}
                              value={selectedOrigins["olva"] || ""}
                              onValueChange={(v) => { setSelectedOrigins(prev => ({ ...prev, olva: v })); setOriginModalOpen(false) }}
                              placeholder="Seleccionar origen..."
                            />
                          </DialogContent>
                        </Dialog>
                      </div>

                      <Button
                        onClick={handleOlvaQuote}
                        disabled={!interprovDest || olvaMutation.isPending}
                        className="w-full"
                        variant="outline"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        {olvaMutation.isPending ? "Cotizando..." : "Cotizar Olva"}
                      </Button>

                      <CategoryResults
                        result={olvaResult}
                        showCostBreakdown={showCostBreakdown}
                        simulatedMargin={simulatedMargin}
                        configMargins={configMargins}
                        isLoading={olvaMutation.isPending}
                      />
                    </div>
                  )}

                  {/* ── Compare button ─────────────────────── */}
                  {hasShalom && hasOlva && (
                    <>
                      <Separator />
                      <Button
                        onClick={handleCompare}
                        disabled={!interprovDest || compareMutation.isPending}
                        className="w-full"
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        {compareMutation.isPending ? "Comparando..." : "Comparar Shalom vs Olva"}
                      </Button>
                      <CategoryResults
                        result={compareResult}
                        showCostBreakdown={showCostBreakdown}
                        simulatedMargin={simulatedMargin}
                        configMargins={configMargins}
                        isLoading={compareMutation.isPending}
                      />
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Local (Lima Metropolitana) ────────────────────── */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-emerald-500" />
                Envios Locales
              </CardTitle>
              <CardDescription>Lima Metropolitana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {localCouriers.length === 0 ? (
                <p className="text-sm text-yellow-600">No hay couriers locales activos</p>
              ) : (
                <>
                  {/* ── Urbano ──────────────────────────── */}
                  {localCouriers.some((c) => c.provider === "urbano") && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize gap-1">
                          Urbano <span className="text-[10px] opacity-70">({configMargins["urbano"] ?? 5}%)</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">{(urbanoLocations || []).length} distritos</span>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Distrito destino</Label>
                        {urbanoLocsLoading ? (
                          <Skeleton className="h-10 mt-1" />
                        ) : (urbanoLocations || []).length > 0 ? (
                          <DestinationCombobox
                            destinations={urbanoLocations || []}
                            value={urbanoDest}
                            onValueChange={(v) => { setUrbanoDest(v); setUrbanoResult(null) }}
                            placeholder="Buscar distrito..."
                          />
                        ) : (
                          <p className="text-sm text-yellow-600 mt-1">No hay distritos configurados para Urbano</p>
                        )}
                      </div>
                      <Button onClick={handleUrbanoQuote} disabled={!urbanoDest || urbanoMutation.isPending} className="w-full" variant="outline">
                        <Calculator className="h-4 w-4 mr-2" />
                        {urbanoMutation.isPending ? "Cotizando..." : "Cotizar Urbano"}
                      </Button>
                      <CategoryResults result={urbanoResult} showCostBreakdown={showCostBreakdown} simulatedMargin={simulatedMargin} configMargins={configMargins} isLoading={urbanoMutation.isPending} />
                    </div>
                  )}

                  {localCouriers.some((c) => c.provider === "urbano") && localCouriers.some((c) => c.provider === "scharff") && <Separator />}

                  {/* ── Scharff ─────────────────────────── */}
                  {localCouriers.some((c) => c.provider === "scharff") && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize gap-1">
                          Scharff <span className="text-[10px] opacity-70">({configMargins["scharff"] ?? 5}%)</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">{(scharffLocations || []).length} distritos</span>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Distrito destino</Label>
                        {scharffLocsLoading ? (
                          <Skeleton className="h-10 mt-1" />
                        ) : (scharffLocations || []).length > 0 ? (
                          <DestinationCombobox
                            destinations={scharffLocations || []}
                            value={scharffDest}
                            onValueChange={(v) => { setScharffDest(v); setScharffResult(null) }}
                            placeholder="Buscar distrito..."
                          />
                        ) : (
                          <p className="text-sm text-yellow-600 mt-1">No hay distritos configurados para Scharff</p>
                        )}
                      </div>
                      <Button onClick={handleScharffQuote} disabled={!scharffDest || scharffMutation.isPending} className="w-full" variant="outline">
                        <Calculator className="h-4 w-4 mr-2" />
                        {scharffMutation.isPending ? "Cotizando..." : "Cotizar Scharff"}
                      </Button>
                      <CategoryResults result={scharffResult} showCostBreakdown={showCostBreakdown} simulatedMargin={simulatedMargin} configMargins={configMargins} isLoading={scharffMutation.isPending} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Controls: breakdown + margin simulator ──────── */}
        {hasResults && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" onClick={() => setShowCostBreakdown(!showCostBreakdown)}>
              {showCostBreakdown ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showCostBreakdown ? "Ocultar desglose" : "Ver desglose"}
            </Button>
          </div>
        )}

        {hasResults && showCostBreakdown && (
          <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-500" />
                Simulador de Margen
              </CardTitle>
              <CardDescription>Prueba diferentes margenes y guarda cuando estes conforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="w-32">
                  <Label className="text-xs">Margen (%)</Label>
                  <Input
                    type="number" step="0.5" min="0" max="100"
                    value={marginInput}
                    onChange={(e) => setMarginInput(e.target.value)}
                    placeholder={String(activeCouriers[0]?.marginPercent ?? 5)}
                  />
                </div>
                <Button onClick={handleSimulateMargin} variant="secondary">Simular</Button>
                {simulatedMargin !== null && (
                  <>
                    <Button onClick={handleResetMargin} variant="ghost">Resetear</Button>
                    <Button onClick={handleSaveMargin} disabled={updateConfigMutation.isPending} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      {updateConfigMutation.isPending ? "Guardando..." : `Guardar ${simulatedMargin}% para todos`}
                    </Button>
                  </>
                )}
              </div>
              {simulatedMargin !== null && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    Simulando: {simulatedMargin}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">Los precios se recalculan en tiempo real</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </BaseLayout>
  )
}