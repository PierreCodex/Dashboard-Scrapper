import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { CourierDepartment } from '@/types/courier'

export function useCourierDepartments(provider: string) {
  return useQuery({
    queryKey: ['courierDepartments', provider],
    queryFn: async () => {
      const { data } = await apiClient.get<CourierDepartment[]>(`/geography/courier/${provider}/departments`)
      return data
    },
    enabled: !!provider,
  })
}
