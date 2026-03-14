import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { CourierConfig } from '@/types/courier'

export function useCourierConfig(provider: string) {
  return useQuery({
    queryKey: ['courierConfig', provider],
    queryFn: async () => {
      const { data } = await apiClient.get<CourierConfig>(`/courier/${provider}/config`)
      return data
    },
    enabled: !!provider,
  })
}
