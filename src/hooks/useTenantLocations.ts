import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { TenantLocation } from '@/types/logistics'

export function useTenantLocations(slug: string, provider?: string) {
  return useQuery({
    queryKey: ['tenantLocations', slug, provider],
    queryFn: async () => {
      const params = provider ? { provider } : undefined
      const { data } = await apiClient.get<TenantLocation[]>(
        `/logistics/tenants/${slug}/locations`,
        { params }
      )
      return data
    },
    enabled: !!slug,
  })
}
