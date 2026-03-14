import { BaseLayout } from "@/components/layouts/base-layout"
import { useCourierAgencies } from "@/hooks/useCourierAgencies"
import { useCourierAgencySearch } from "@/hooks/useCourierAgencySearch"
import { useCourierQuote } from "@/hooks/useCourierQuote"
import { MERCHANDISE_INFO, type QuoteRequest, type QuoteResponse } from "@/types/courier"
import { COURIERS } from "@/types/logistics"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useRef, useEffect } from "react"
import { Calculator, TrendingDown, Clock, Weight, Package, Search, MapPin, ArrowRight } from "lucide-react"
import { toast } from "sonner"

const PROVIDERS = Object.entries(COURIERS)
  .filter(([, info]) => info.status === "implemented")
  .map(([key, info]) => ({ key, ...info }))

export default function SimulatePage() {
  const [provider, setProvider] = useState(PROVIDERS[0].key)
  const [form, setForm] = useState<QuoteRequest>({
    origin: "",
    destination: "",
    weight: 1,
  })
  const [result, setResult] = useState<QuoteResponse | null>(null)
  const [showOriginDropdown, setShowOriginDropdown] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)
  const [originSearch, setOriginSearch] = useState("")
  const [destSearch, setDestSearch] = useState("")

  const originInputRef = useRef<HTMLDivElement>(null)
  const destInputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originInputRef.current && !originInputRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false)
      }
      if (destInputRef.current && !destInputRef.current.contains(event.target as Node)) {
        setShowDestDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const { data: originAgencies } = useCourierAgencies(provider, originSearch.split(" - ")[0] || "")
  const { data: destAgencies } = useCourierAgencies(provider, destSearch.split(" - ")[0] || "")
  const { data: originSearchResults } = useCourierAgencySearch(provider, originSearch)
  const { data: destSearchResults } = useCourierAgencySearch(provider, destSearch)

  const quoteMutation = useCourierQuote(provider)
  const courierInfo = COURIERS[provider]
  const merchandiseInfo = MERCHANDISE_INFO[provider]
  const selectedMerchandise = merchandiseInfo?.types.find((t) => t.value === form.merchandiseType)

  const originDisplayAgencies = provider === "shalom" && originSearch.length >= 2 
    ? originSearchResults 
    : originAgencies?.slice(0, 30)

  const destDisplayAgencies = provider === "shalom" && destSearch.length >= 2 
    ? destSearchResults 
    : destAgencies?.slice(0, 30)

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider)
    setForm({ origin: "", destination: "", weight: 1 })
    setResult(null)
    setShowOriginDropdown(false)
    setShowDestDropdown(false)
    setOriginSearch("")
    setDestSearch("")
  }

  const handleOriginSelect = (agencyName: string) => {
    setForm({ ...form, origin: agencyName })
    setShowOriginDropdown(false)
    setOriginSearch("")
  }

  const handleDestSelect = (agencyName: string) => {
    setForm({ ...form, destination: agencyName })
    setShowDestDropdown(false)
    setDestSearch("")
  }

  const handleOriginChange = (value: string) => {
    setForm({ ...form, origin: value })
    setOriginSearch(value)
    if (provider === "shalom" && value.length >= 1) {
      setShowOriginDropdown(true)
    }
  }

  const handleDestChange = (value: string) => {
    setForm({ ...form, destination: value })
    setDestSearch(value)
    if (provider === "shalom" && value.length >= 1) {
      setShowDestDropdown(true)
    }
  }

  const handleQuote = async () => {
    if (!form.origin || !form.destination) {
      toast.error("Ingresa origen y destino")
      return
    }
    try {
      const data = await quoteMutation.mutateAsync(form)
      setResult(data)
    } catch {
      toast.error("Error al cotizar. Verifica los datos.")
    }
  }

  const getAgencyInfo = (agency: { name: string; address: string | null; metadata: Record<string, unknown> }) => {
    return {
      name: agency.name,
      address: agency.address || "",
      department: String(agency.metadata?.department ?? agency.metadata?.departamento ?? ""),
      zone: String(agency.metadata?.zone ?? ""),
    }
  }

  return (
    <BaseLayout title="Cotizador Courier" description="Simula cotizaciones directas como en la web real de cada courier">
      <div className="px-4 lg:px-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <Button
              key={p.key}
              variant={provider === p.key ? "default" : "outline"}
              onClick={() => handleProviderChange(p.key)}
              className={`capitalize gap-2 ${provider === p.key ? "shadow-md" : ""}`}
            >
              <span>{p.name}</span>
              {p.status === "implemented" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  ✓
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                {courierInfo.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary font-medium">
                  {courierInfo.format}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div ref={originInputRef}>
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <MapPin className="h-3 w-3" /> Origen
                    {provider === "shalom" && <Badge variant="secondary" className="ml-1 text-[10px]">buscar agencia</Badge>}
                  </Label>
                  {provider === "shalom" ? (
                    <>
                      <div className="relative mt-1.5">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={form.origin}
                          onChange={(e) => handleOriginChange(e.target.value)}
                          placeholder="Escribe para buscar..."
                          onFocus={() => form.origin && setShowOriginDropdown(true)}
                        />
                      </div>
                      {showOriginDropdown && originDisplayAgencies && originDisplayAgencies.length > 0 && (
                        <div className="absolute z-50 w-[90%] mt-1 max-h-64 overflow-auto border rounded-md shadow-lg bg-background animate-in fade-in slide-in-from-top-1">
                          {originDisplayAgencies.map((agency) => {
                            const info = getAgencyInfo(agency)
                            return (
                              <div
                                key={agency.id}
                                className="px-3 py-2.5 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                onClick={() => handleOriginSelect(agency.name)}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm truncate">{info.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{info.address}</div>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    {info.department && <Badge variant="outline" className="text-[10px] py-0">{info.department}</Badge>}
                                    {info.zone && <Badge variant="secondary" className="text-[10px] py-0">{info.zone}</Badge>}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Input
                      className="mt-1.5"
                      value={form.origin}
                      onChange={(e) => setForm({ ...form, origin: e.target.value })}
                      placeholder={courierInfo.example}
                    />
                  )}
                </div>
                <div ref={destInputRef}>
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <MapPin className="h-3 w-3" /> Destino
                    {provider === "shalom" && <Badge variant="secondary" className="ml-1 text-[10px]">buscar agencia</Badge>}
                  </Label>
                  {provider === "shalom" ? (
                    <>
                      <div className="relative mt-1.5">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={form.destination}
                          onChange={(e) => handleDestChange(e.target.value)}
                          placeholder="Escribe para buscar..."
                          onFocus={() => form.destination && setShowDestDropdown(true)}
                        />
                      </div>
                      {showDestDropdown && destDisplayAgencies && destDisplayAgencies.length > 0 && (
                        <div className="absolute z-50 w-[90%] mt-1 max-h-64 overflow-auto border rounded-md shadow-lg bg-background animate-in fade-in slide-in-from-top-1">
                          {destDisplayAgencies.map((agency) => {
                            const info = getAgencyInfo(agency)
                            return (
                              <div
                                key={agency.id}
                                className="px-3 py-2.5 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                onClick={() => handleDestSelect(agency.name)}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm truncate">{info.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{info.address}</div>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    {info.department && <Badge variant="outline" className="text-[10px] py-0">{info.department}</Badge>}
                                    {info.zone && <Badge variant="secondary" className="text-[10px] py-0">{info.zone}</Badge>}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Input
                      className="mt-1.5"
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      placeholder={courierInfo.example}
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                {merchandiseInfo && (
                  <div>
                    <Label>Tipo de Mercadería</Label>
                    <Select
                      value={form.merchandiseType}
                      onValueChange={(v) => setForm({ ...form, merchandiseType: v as QuoteRequest["merchandiseType"], packageSize: undefined, length: undefined, width: undefined, height: undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {merchandiseInfo.types.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
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

              {selectedMerchandise && (
                <p className="text-xs text-muted-foreground">{selectedMerchandise.description}</p>
              )}

              <Button onClick={handleQuote} disabled={quoteMutation.isPending} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                {quoteMutation.isPending ? "Cotizando..." : "Cotizar"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {result && (
              <>
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      {result.provider.toUpperCase()} — {result.origin} <ArrowRight className="h-3 w-3" /> {result.destination}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(result.scrapedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {result.services.length === 0 ? (
                  <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <CardContent className="pt-4 flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                      <Package className="h-4 w-4" />
                      No se encontraron servicios para esta ruta.
                    </CardContent>
                  </Card>
                ) : (
                  result.services
                    .sort((a, b) => a.price - b.price)
                    .map((service, i) => (
                      <Card key={i} className={i === 0 ? "border-green-500/50 bg-green-500/5" : ""}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{service.serviceType}</span>
                                {i === 0 && (
                                  <Badge className="bg-green-500 hover:bg-green-600">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    Mejor precio
                                  </Badge>
                                )}
                              </div>
                              {service.transitDays && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {service.transitDays} días
                                </div>
                              )}
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                {service.pricePerKilo && (
                                  <span className="flex items-center gap-1">
                                    <Weight className="h-3 w-3" />
                                    S/{service.pricePerKilo}/kg
                                  </span>
                                )}
                                {service.pricePerVolume && (
                                  <span className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    S/{service.pricePerVolume}/vol
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {service.currency} {service.price}
                              </div>
                              <div className="text-xs text-muted-foreground">Precio real</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </>
            )}

            {!result && !quoteMutation.isPending && (
              <Card className="border-dashed border-2">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calculator className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium">Simula tu cotización</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecciona un courier, ingresa origen y destino, luego cotiza
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Verás el precio real tal como aparece en la web del courier
                  </p>
                </CardContent>
              </Card>
            )}

            {quoteMutation.isPending && (
              <Card>
                <CardContent className="pt-8 pb-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Calculator className="h-8 w-8 text-primary animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      </div>
                    </div>
                    <p className="text-sm font-medium animate-pulse">Cotizando en {courierInfo.name}...</p>
                    <p className="text-xs text-muted-foreground">Esto puede tomar unos segundos</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
