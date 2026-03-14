import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { TenantConfigResponse } from '@/types/logistics'

export function useTenantConfig(slug: string) {
  return useQuery({
    queryKey: ['tenantConfig', slug],
    queryFn: async () => {
      const { data } = await apiClient.get<TenantConfigResponse>(
        `/logistics/tenants/${slug}/config`
      )
      return data
    },
    enabled: !!slug,
  })
}
