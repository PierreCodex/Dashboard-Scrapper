import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { LocationAgenciesResponse } from '@/types/logistics'

export function useLocationAgencies(slug: string, location: string, provider: string) {
  return useQuery({
    queryKey: ['locationAgencies', slug, location, provider],
    queryFn: async () => {
      const { data } = await apiClient.get<LocationAgenciesResponse>(
        `/logistics/tenants/${slug}/locations/${encodeURIComponent(location)}/agencies`,
        { params: { provider } }
      )
      return data
    },
    enabled: !!slug && !!location && !!provider,
  })
}
