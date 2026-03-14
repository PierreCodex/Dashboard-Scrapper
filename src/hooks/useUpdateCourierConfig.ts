import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { TenantCourierConfig } from '@/types/logistics'

interface UpdateCourierConfigParams {
  slug: string
  provider: string
  marginPercent?: number
  isActive?: boolean
  priority?: number
  merchandiseType?: string
  defaultOrigin?: string
}

export function useUpdateCourierConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ slug, provider, ...body }: UpdateCourierConfigParams) => {
      const { data } = await apiClient.put<TenantCourierConfig>(
        `/logistics/tenants/${slug}/config/${provider}`,
        body
      )
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenantConfig', variables.slug] })
    },
  })
}
