import { useState, useMemo } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { TenantLocation } from "@/types/logistics"

interface DestinationComboboxProps {
  destinations: TenantLocation[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DestinationCombobox({
  destinations,
  value,
  onValueChange,
  placeholder = "Seleccionar destino...",
  disabled = false,
}: DestinationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selected = destinations.find((d) => d.name === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return destinations.slice(0, 50)
    const q = search.toLowerCase().trim()
    return destinations.filter((d) => {
      const searchable = [d.name, d.department, d.province]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return searchable.includes(q)
    }).slice(0, 50)
  }, [destinations, search])

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
            {selected ? (
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-[10px] px-1 h-5 font-normal bg-blue-50 text-blue-700 border-blue-200">
                  {selected.department}
                </Badge>
                {selected.name}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="center" sideOffset={5}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre, departamento o provincia..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {filtered.map((dest) => (
                <CommandItem
                  key={dest.name}
                  value={dest.name}
                  onSelect={(v) => {
                    onValueChange(v === value ? "" : v)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="flex items-center gap-2"
                >
                  <Check className={cn("h-4 w-4 shrink-0", value === dest.name ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      {dest.department && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal bg-blue-50 text-blue-700 border-blue-200">
                          {dest.department}
                        </Badge>
                      )}
                      {dest.province && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal bg-amber-50 text-amber-700 border-amber-200">
                          {dest.province}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">{dest.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
