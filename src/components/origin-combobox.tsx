import { useState, useMemo } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CourierOrigin } from "@/hooks/useCourierOrigins"

interface OriginComboboxProps {
  origins: CourierOrigin[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** If true, shows department/province badges on each option (for Olva) */
  showHierarchy?: boolean
  /** If true, shows all details including point name and address (for Scharff) */
  showFullDetails?: boolean
}

export function OriginCombobox({
  origins,
  value,
  onValueChange,
  placeholder = "Seleccionar origen...",
  disabled = false,
  showHierarchy = false,
  showFullDetails = false,
}: OriginComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selected = origins.find((o) => o.value === value)

  // Build search index: each origin is searchable by label, department, province, district
  const filtered = useMemo(() => {
    if (!search.trim()) return origins.slice(0, 100) // show first 100 when no search
    const q = search.toLowerCase().trim()
    return origins.filter((o) => {
      const searchable = [o.label, o.department, o.province, o.district, o.detail, o.value]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return searchable.includes(q)
    }).slice(0, 100)
  }, [origins, search])

  const displayLabel = selected
    ? showHierarchy
      ? `${selected.district || selected.label} (${selected.department}/${selected.province})`
      : selected.label
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-9 text-sm"
        >
          <span className="truncate">
            {displayLabel || <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="center" sideOffset={5}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {filtered.map((origin) => (
                <CommandItem
                  key={origin.value}
                  value={origin.value}
                  onSelect={(v) => {
                    onValueChange(v === value ? "" : v)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="flex items-center gap-2"
                >
                  <Check className={cn("h-4 w-4 shrink-0", value === origin.value ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    {showFullDetails && (origin.department || origin.province) ? (
                      <>
                        <div className="flex items-center gap-1 flex-wrap">
                          {origin.department && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal bg-blue-50 text-blue-700 border-blue-200">
                              {origin.department}
                            </Badge>
                          )}
                          {origin.province && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal bg-amber-50 text-amber-700 border-amber-200">
                              {origin.province}
                            </Badge>
                          )}
                          {origin.district && (
                            <span className="text-xs font-medium">{origin.district}</span>
                          )}
                        </div>
                        {origin.pointName && (
                          <span className="text-sm font-medium text-green-700">{origin.pointName}</span>
                        )}
                        {origin.address && (
                          <span className="text-[10px] text-muted-foreground truncate">{origin.address}</span>
                        )}
                      </>
                    ) : showHierarchy && (origin.department || origin.province) ? (
                      <>
                        <div className="flex items-center gap-1 flex-wrap">
                          {origin.department && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal bg-blue-50 text-blue-700 border-blue-200">
                              {origin.department}
                            </Badge>
                          )}
                          {origin.province && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal bg-amber-50 text-amber-700 border-amber-200">
                              {origin.province}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium">{origin.district || origin.label}</span>
                      </>
                    ) : (
                      <span className="text-sm truncate">{origin.label}</span>
                    )}
                    {origin.detail && !showHierarchy && !showFullDetails && (
                      <span className="text-[10px] text-muted-foreground truncate">{origin.detail}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-auto">
                    {showHierarchy || showFullDetails ? origin.value : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}