import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { CourierAgency } from '@/types/courier'

export function useCourierAgencySearch(provider: string, query: string) {
  return useQuery({
    queryKey: ['courierAgencySearch', provider, query],
    queryFn: async () => {
      const { data } = await apiClient.get<CourierAgency[]>(
        `/geography/courier/${provider}/agencies/search`,
        { params: { q: query } }
      )
      return data
    },
    enabled: !!provider && !!query && query.length >= 2,
  })
}
