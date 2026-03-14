import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { QuoteRequest, QuoteResponse } from '@/types/courier'

export function useCourierQuote(provider: string) {
  return useMutation({
    mutationFn: async (body: QuoteRequest) => {
      const { data } = await apiClient.post<QuoteResponse>(
        `/courier/${provider}/quote`,
        body
      )
      return data
    },
  })
}
