export interface Tenant {
  id: string
  name: string
  slug: string
  isActive: boolean
}

export interface TenantCourierConfig {
  id: string
  provider: string
  isActive: boolean
  priority: number
  marginPercent: number
  merchandiseType: string
  defaultOrigin: string
}

export interface TenantConfigResponse {
  tenant: Tenant
  configs: TenantCourierConfig[]
}

export interface TenantLocation {
  name: string
  department: string
  province?: string
}

export interface ShalomAgency {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  courierCode: string
  isDefault: boolean
}

export interface OlvaDistrict {
  id: string
  name: string
  code: string
  courierCode: string
}

export interface PickupPoint {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  pointType: string
  metadata?: Record<string, unknown>
}

export interface ShalomAgenciesResponse {
  provider: string
  locationName: string
  type: 'agencies'
  defaultCourierCode: string
  agencies: ShalomAgency[]
}

export interface OlvaAgenciesResponse {
  provider: string
  locationName: string
  type: 'districts'
  defaultCourierCode: string
  districts: OlvaDistrict[]
  pickupPoints: PickupPoint[]
}

export type LocationAgenciesResponse = ShalomAgenciesResponse | OlvaAgenciesResponse

export interface ShippingItem {
  weightKg: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  quantity: number
}

export interface ShippingBreakdown {
  totalWeightKg: number
  volumetricWeightKg: number
  chargeableWeightKg: number
  boxLengthCm?: number
  boxWidthCm?: number
  boxHeightCm?: number
  packingEfficiency?: number
}

export interface ShippingOption {
  provider: string
  serviceType: string
  courierCost: number
  tenantCost: number
  currency: string
  breakdown: ShippingBreakdown
}

export interface SkippedProvider {
  provider: string
  reason: string
}

export interface CalculateShippingRequest {
  tenantId: string
  destination: string
  items: ShippingItem[]
  agencyOverrides?: Record<string, string>
  providers?: string[]
}

export interface CalculateShippingResponse {
  tenantId: string
  destination: string
  options: ShippingOption[]
  skippedProviders: SkippedProvider[]
  calculatedAt: string
}

export interface Shipment {
  id: string
  externalOrderId: string
  tenantId: string
  provider: string
  serviceType?: string
  status: string
  courierCost: number
  tenantCost: number
  deliveryMethod?: 'AGENCY_PICKUP' | 'HOME_DELIVERY'
  customerName: string
  customerPhone?: string
  customerEmail?: string
  createdAt: string
}

export interface CreateShipmentRequest {
  externalOrderId: string
  tenantId: string
  destination: string
  provider: string
  serviceType?: string
  courierCost: number
  tenantCost: number
  deliveryMethod?: 'AGENCY_PICKUP' | 'HOME_DELIVERY'
  pickupAgencyId?: string
  deliveryAddress?: string
  deliveryReference?: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  items: ShippingItem[]
}

export interface CourierQuoteService {
  serviceType: string
  price: number
  currency: string
}

export interface CourierQuoteResponse {
  provider: string
  services: CourierQuoteService[]
  source: string
}

export interface CourierInfo {
  name: string
  format: string
  example: string
  status: 'implemented' | 'placeholder'
}

export const COURIERS: Record<string, CourierInfo> = {
  shalom: { name: 'Shalom', format: 'Nombre de agencia', example: 'MALVINAS - JR. RICARDO TRENEMAN', status: 'implemented' },
  olva: { name: 'Olva', format: 'Ubigeo INEI (depto/prov/dist)', example: '15/1501/150101', status: 'implemented' },
  urbano: { name: 'Urbano', format: 'DEPTO - PROV - DIST', example: 'LIMA - LIMA - LIMA', status: 'implemented' },
  scharff: { name: 'Scharff', format: 'Depto - Prov - Distrito', example: 'Lima - Lima - Lima', status: 'implemented' },
}

export const DEFAULT_TENANT_SLUG = 'lyrium'
export const DEFAULT_TENANT_ID = 'cmmn88vs50000vvm8v3hpjvcs'
