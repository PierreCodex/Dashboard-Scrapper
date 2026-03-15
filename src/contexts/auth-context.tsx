import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useValidateToken } from '@/hooks/useValidateToken'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'TENANT_USER'
  permissions: string[]
  tenantId: string | null
  tenantSlug: string | null
  tenantName: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isTenantUser: boolean
  isLoading: boolean
  hasPermission: (permission: string) => boolean
  login: (email: string, password: string) => Promise<{ isAdmin: boolean }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const validateToken = useValidateToken()

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setIsValidating(true)
      
      validateToken.mutate(undefined, {
        onSuccess: (userData) => {
          setUser(userData)
          setIsValidating(false)
          localStorage.setItem(USER_KEY, JSON.stringify(userData))
        },
        onError: () => {
          setToken(null)
          setUser(null)
          setIsValidating(false)
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
        },
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { apiClient } = await import('@/lib/api')
    const response = await apiClient.post<{
      accessToken: string
      user: AuthUser
    }>('/auth/login', { email, password })

    const { accessToken, user: userData } = response.data
    setToken(accessToken)
    setUser(userData)
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    return { isAdmin: userData.role === 'ADMIN' }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const isAdmin = user?.role === 'ADMIN'
  const isTenantUser = user?.role === 'TENANT_USER'

  const hasPermission = (permission: string) => {
    if (isAdmin) return true
    return user?.permissions.includes(permission) ?? false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isTenantUser,
        hasPermission,
        login,
        logout,
        isLoading: isLoading || isValidating,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
