import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { CourierAgency } from '@/types/courier'

export function useCourierAgencies(provider: string, department: string, province?: string) {
  return useQuery({
    queryKey: ['courierAgencies', provider, department, province],
    queryFn: async () => {
      const { data } = await apiClient.get<CourierAgency[]>(
        `/geography/courier/${provider}/departments/${encodeURIComponent(department)}/agencies`,
        { params: province ? { province } : undefined }
      )
      return data
    },
    enabled: !!provider && !!department,
  })
}
