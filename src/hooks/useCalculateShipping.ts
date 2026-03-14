import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { CalculateShippingRequest, CalculateShippingResponse } from '@/types/logistics'

export function useCalculateShipping() {
  return useMutation({
    mutationFn: async (body: CalculateShippingRequest) => {
      const { data } = await apiClient.post<CalculateShippingResponse>(
        '/logistics/shipping/calculate',
        body
      )
      return data
    },
  })
}
