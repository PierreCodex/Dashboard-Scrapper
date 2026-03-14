import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface ApiKey {
  id: string
  name: string
  prefix: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export interface CreateApiKeyResponse {
  id: string
  name: string
  key: string
  prefix: string
  createdAt: string
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiKey[]>('/api-keys')
      return data
    },
  })
}

export function useCreateApiKey() {
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await apiClient.post<CreateApiKeyResponse>('/api-keys', { name })
      return data
    },
  })
}

export function useRevokeApiKey() {
  return useMutation({
    mutationFn: async (keyId: string) => {
      const { data } = await apiClient.delete(`/api-keys/${keyId}`)
      return data
    },
  })
}
