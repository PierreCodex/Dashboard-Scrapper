import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface QuoteHistoryItem {
  length: number
  width: number
  height: number
  weight: number
  quantity: number
}

export interface BoxDimensions {
  length: number
  width: number
  height: number
  efficiency: number
  weight?: number
}

export interface QuoteHistory {
  id: string
  provider: string | null
  origin: string | null
  destination: string
  weight: number
  packageType: string | null
  length: number | null
  width: number | null
  height: number | null
  items: QuoteHistoryItem[] | null
  courierCost: number | null
  tenantCost: number | null
  currency: string
  serviceType: string | null
  boxDimensions: BoxDimensions | null
  source: 'api' | 'panel'
  apiKeyId: string | null
  userId: string | null
  createdAt: string
}

export interface QuoteHistoryResponse {
  quotes: QuoteHistory[]
  total: number
  limit: number
  offset: number
}

export interface QuoteStats {
  totalQuotes: number
  byProvider: { provider: string; count: number }[]
  recentQuotes: QuoteHistory[]
}

export function useQuoteHistory(filters?: {
  provider?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['quote-history', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.provider) params.append('provider', filters.provider)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.limit) params.append('limit', String(filters.limit))
      if (filters?.offset) params.append('offset', String(filters.offset))
      
      const { data } = await apiClient.get<QuoteHistoryResponse>(`/quote-history?${params}`)
      return data
    },
  })
}

export function useQuoteStats(days?: number) {
  return useQuery({
    queryKey: ['quote-stats', days],
    queryFn: async () => {
      const { data } = await apiClient.get<QuoteStats>(`/quote-history/stats?days=${days || 30}`)
      return data
    },
  })
}
