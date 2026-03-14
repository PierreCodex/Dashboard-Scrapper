export interface CourierConfig {
  provider: string
  name: string
  defaultOrigin: string
  defaultOriginLabel: string
  originInfo: {
    agencyName?: string
    address?: string
    latitude?: string
    longitude?: string
    department?: string
    province?: string
    schedule?: string
  }
  originSteps: Array<{ label: string; endpoint: string; valueField: string }>
  destinationSteps: Array<{ label: string; endpoint: string; valueField: string }>
  buildOrigin: string
  buildDestination: string
}

export interface CourierAgency {
  id: string
  provider: string
  externalId: string
  name: string
  address: string | null
  latitude: string | null
  longitude: string | null
  isActive: boolean
  pointType: string | null
  metadata: Record<string, unknown>
  locationCode: string | null
}

export interface CourierDepartment {
  name: string
}

export interface CourierProvince {
  name: string
}

export interface QuoteRequest {
  origin: string
  destination: string
  weight: number
  merchandiseType?: 'sobre' | 'paquete' | 'otra_medida'
  packageSize?: 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | '4XL'
  length?: number
  width?: number
  height?: number
}

export interface QuoteResponse {
  provider: string
  origin: string
  destination: string
  services: Array<{
    serviceType: string
    price: number
    currency: string
    transitDays: number | null
    pricePerKilo: number | null
    pricePerVolume: number | null
  }>
  scrapedAt: string
}

export interface MerchandiseType {
  value: string
  label: string
  description: string
  requiresDimensions: boolean
  packageSizes: string[] | null
}

export const MERCHANDISE_INFO: Record<string, { types: MerchandiseType[] }> = {
  shalom: {
    types: [
      {
        value: 'sobre',
        label: 'Sobre',
        description: 'Tarifa plana S/8 por peso, no requiere dimensiones',
        requiresDimensions: false,
        packageSizes: null,
      },
      {
        value: 'paquete',
        label: 'Paquete',
        description: '5 tallas predefinidas, precio fijo por talla y ruta',
        requiresDimensions: false,
        packageSizes: ['XXS', 'XS', 'S', 'M', 'L'],
      },
      {
        value: 'otra_medida',
        label: 'Otra Medida',
        description: 'Medidas custom (largo, ancho, alto). Usa max(peso_real, peso_volumétrico). Factor: L×A×H / 5000',
        requiresDimensions: true,
        packageSizes: null,
      },
    ],
  },
  olva: {
    types: [
      {
        value: 'sobre',
        label: 'Sobre',
        description: 'Solo peso, sin dimensiones',
        requiresDimensions: false,
        packageSizes: null,
      },
      {
        value: 'paquete',
        label: 'Paquete',
        description: 'Peso + dimensiones obligatorias (largo, ancho, alto en cm)',
        requiresDimensions: true,
        packageSizes: null,
      },
    ],
  },
  urbano: {
    types: [
      {
        value: 'paquete',
        label: 'Paquete',
        description: 'Cobra por medida lineal (alto + largo + ancho), NO por peso. Tallas: XXS (≤55cm), XS (≤64), S (≤87), M (≤110), L (≤139), XL (≤159), XXL-4XL',
        requiresDimensions: true,
        packageSizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
      },
    ],
  },
  scharff: {
    types: [
      {
        value: 'paquete',
        label: 'Paquete',
        description: 'Tallas auto-detectadas por dimensiones. Dimensiones opcionales.',
        requiresDimensions: false,
        packageSizes: ['SBR', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
      },
    ],
  },
}

export interface SyncAgenciesResponse {
  provider: string
  scraped: number
  created: number
  updated: number
  deactivated: number
  duration: string
}
