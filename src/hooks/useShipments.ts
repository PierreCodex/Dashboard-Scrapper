import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

export interface Shipment {
  id: string
  externalOrderId: string
  tenantId: string
  provider: string
  origin: string
  destination: string
  weight: number
  status: string
  trackingCode?: string
  price?: number
  createdAt: string
}

export function useShipments(limit = 50) {
  return useQuery<Shipment[]>({
    queryKey: ["shipments", "all", limit],
    queryFn: async () => {
      const { data } = await apiClient.get("/logistics/shipments", {
        params: { limit },
      })
      return data
    },
    refetchInterval: 60000,
  })
}
