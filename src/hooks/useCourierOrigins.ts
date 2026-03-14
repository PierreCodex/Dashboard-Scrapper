import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface CourierOrigin {
  value: string
  label: string
  detail?: string
  department?: string
  province?: string
  district?: string
  pointName?: string
  address?: string
}

export function useCourierOrigins(provider: string) {
  return useQuery({
    queryKey: ['courierOrigins', provider],
    queryFn: async () => {
      const { data } = await apiClient.get<CourierOrigin[]>(
        `/geography/courier/${provider}/origins`
      )
      return data
    },
    enabled: !!provider,
    staleTime: 1000 * 60 * 30, // 30 min — origins rarely change
  })
}
