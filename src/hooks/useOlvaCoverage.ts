import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface OlvaDistrict {
  district: string
  ubigeo: string
  quoteFormat: string
  agencyCount: number
}

export interface OlvaProvince {
  province: string
  districts: OlvaDistrict[]
}

export interface OlvaDepartmentCoverage {
  department: string
  provinces: OlvaProvince[]
}

export function useOlvaCoverage(department?: string) {
  return useQuery({
    queryKey: ['olva', 'coverage', department],
    queryFn: async () => {
      const params = department ? { department } : undefined
      const { data } = await apiClient.get<OlvaDepartmentCoverage[]>(
        '/geography/courier/olva/coverage',
        { params }
      )
      return data
    },
  })
}
