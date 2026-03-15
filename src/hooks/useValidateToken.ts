import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { AuthUser } from '@/contexts/auth-context'

export function useValidateToken() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me')
      return data.user
    },
  })
}