import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

export interface CourierLocation {
  code: string
  name: string
}

export function useCourierLocations(
  provider: string,
  level: "departamento" | "provincia" | "distrito",
  parentCode?: string
) {
  return useQuery<CourierLocation[]>({
    queryKey: ["courier", provider, "locations", level, parentCode],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (level) params.set("level", level)
      if (parentCode) params.set("parentCode", parentCode)
      
      const { data } = await apiClient.get(`/geography/courier/${provider}/locations`, {
        params: Object.fromEntries(params),
      })
      return data
    },
    enabled: !!provider && !!level,
  })
}
