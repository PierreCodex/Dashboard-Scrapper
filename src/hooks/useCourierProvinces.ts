import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { CourierProvince } from '@/types/courier'

export function useCourierProvinces(provider: string, department: string) {
  return useQuery({
    queryKey: ['courierProvinces', provider, department],
    queryFn: async () => {
      const { data } = await apiClient.get<CourierProvince[]>(
        `/geography/courier/${provider}/departments/${encodeURIComponent(department)}/provinces`
      )
      return data
    },
    enabled: !!provider && !!department,
  })
}
