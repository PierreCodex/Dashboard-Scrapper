import { useAuth } from '@/contexts/auth-context'
import type { ReactNode } from 'react'

interface PermissionGateProps {
  children: ReactNode
  permission: string
}

export function PermissionGate({ children, permission }: PermissionGateProps) {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return null
  }

  return <>{children}</>
}
