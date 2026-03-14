import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SyncAgenciesResponse } from '@/types/courier'

export function useSyncAgencies(provider: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      console.log(`[Sync] Starting sync for ${provider}`)
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch(`/api/v1/geography/admin/agencies/sync/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data: SyncAgenciesResponse = await response.json()
      console.log(`[Sync] Completed for ${provider}:`, data)
      
      return data
    },
    onSuccess: () => {
      console.log(`[Sync] Invalidating queries for ${provider}`)
      queryClient.invalidateQueries({ queryKey: ['courierAgencies', provider] })
      queryClient.invalidateQueries({ queryKey: ['courierDepartments', provider] })
    },
  })
}
