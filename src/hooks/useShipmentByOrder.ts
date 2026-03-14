import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Shipment } from '@/types/logistics'

export function useShipmentByOrder(orderId: string) {
  return useQuery({
    queryKey: ['shipmentByOrder', orderId],
    queryFn: async () => {
      const { data } = await apiClient.get<Shipment>(
        `/logistics/shipments/order/${encodeURIComponent(orderId)}`
      )
      return data
    },
    enabled: !!orderId,
  })
}
