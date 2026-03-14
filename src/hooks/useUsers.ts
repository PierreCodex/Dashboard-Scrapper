import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'TENANT_USER'
  permissions: string[]
  tenantId: string | null
  tenantSlug: string | null
  tenantName: string | null
  isActive: boolean
  createdAt: string
}

export interface Permission {
  name: string
  description: string
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>('/auth/users')
      return data
    },
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await apiClient.get<Permission[]>('/auth/permissions')
      return data
    },
  })
}

export function useToggleUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.patch<User>(`/auth/users/${userId}/toggle`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      const { data } = await apiClient.put<User>(`/auth/users/${userId}/permissions`, { permissions })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: {
      email: string
      password: string
      name: string
      role: 'ADMIN' | 'TENANT_USER'
      tenantId?: string
    }) => {
      const { data } = await apiClient.post<User>('/auth/users', userData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
