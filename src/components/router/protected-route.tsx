import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import type { ReactNode } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: Array<'ADMIN' | 'TENANT_USER'>
  permissions?: string[]
}

export function ProtectedRoute({ children, roles, permissions }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, hasPermission, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (roles && roles.length > 0) {
    const userRole = isAdmin ? 'ADMIN' : 'TENANT_USER'
    if (!roles.includes(userRole)) {
      return <Navigate to="/errors/forbidden" replace />
    }
  }

  if (permissions && permissions.length > 0) {
    const hasAllPermissions = permissions.every((perm) => hasPermission(perm))
    if (!hasAllPermissions) {
      return <Navigate to="/errors/forbidden" replace />
    }
  }

  return <>{children}</>
}
