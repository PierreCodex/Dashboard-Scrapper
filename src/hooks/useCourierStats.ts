import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

export interface CourierStats {
  browserPool: {
    active: number
    maxConcurrent: number
    queued: number
  }
  timestamp: string
}

export function useCourierStats() {
  return useQuery<CourierStats>({
    queryKey: ["courier", "stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/courier/stats")
      return data
    },
    refetchInterval: 30000,
  })
}
