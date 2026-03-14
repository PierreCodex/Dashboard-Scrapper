import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface PackingItem {
  length: number
  width: number
  height: number
  weight: number
  quantity: number
}

export interface PackingResult {
  length: number
  width: number
  height: number
  totalWeight: number
  totalVolume: number
  boxVolume: number
  efficiency: number
}

export function useEstimateBox() {
  return useMutation({
    mutationFn: async (items: PackingItem[]) => {
      const { data } = await apiClient.post<PackingResult>(
        '/courier/estimate-box',
        items
      )
      return data
    },
  })
}
