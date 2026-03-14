import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface TenantListItem {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
  _count: {
    users: number
    courierConfigs: number
    locationMappings: number
    shipments: number
  }
}

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data } = await apiClient.get<TenantListItem[]>('/logistics/tenants')
      return data
    },
  })
}
