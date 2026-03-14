import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/router/protected-route'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const LoginPage = lazy(() => import('@/app/auth/login/page'))

const Dashboard = lazy(() => import('@/app/dashboard/page'))

const Unauthorized = lazy(() => import('@/app/errors/unauthorized/page'))
const Forbidden = lazy(() => import('@/app/errors/forbidden/page'))
const NotFound = lazy(() => import('@/app/errors/not-found/page'))
const InternalServerError = lazy(() => import('@/app/errors/internal-server-error/page'))
const UnderMaintenance = lazy(() => import('@/app/errors/under-maintenance/page'))

const AppearanceSettings = lazy(() => import('@/app/settings/appearance/page'))

const CouriersPage = lazy(() => import('@/app/couriers/[provider]/page'))
const TenantsPage = lazy(() => import('@/app/tenants/[slug]/page'))
const SimulatePage = lazy(() => import('@/app/simulate/page'))
const ShipmentsPage = lazy(() => import('@/app/shipments/page'))
const UsersPage = lazy(() => import('@/app/users/page'))

const EmpresaDashboard = lazy(() => import('@/app/empresa/dashboard/page'))
const EmpresaCotizar = lazy(() => import('@/app/empresa/cotizar/page'))
const EmpresaEnvios = lazy(() => import('@/app/empresa/envios/page'))
const EmpresaCiudades = lazy(() => import('@/app/empresa/ciudades/page'))
const EmpresaCouriers = lazy(() => import('@/app/empresa/couriers/page'))
const EmpresaConfig = lazy(() => import('@/app/empresa/config/page'))
const EmpresaApi = lazy(() => import('@/app/empresa/api/page'))
const EmpresaHistorial = lazy(() => import('@/app/empresa/historial/page'))
const EmpresaDocs = lazy(() => import('@/app/empresa/docs/page'))

export interface RouteConfig {
  path: string
  element: React.ReactNode
  children?: RouteConfig[]
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<LoadingSpinner />}>{element}</Suspense>
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    element: <Navigate to="dashboard" replace />
  },

  {
    path: "/auth/login",
    element: withSuspense(<LoginPage />)
  },

  {
    path: "/dashboard",
    element: withSuspense(
      <ProtectedRoute roles={["ADMIN"]}>
        <Dashboard />
      </ProtectedRoute>
    )
  },

  {
    path: "/couriers/:provider",
    element: withSuspense(
      <ProtectedRoute roles={["ADMIN"]}>
        <CouriersPage />
      </ProtectedRoute>
    )
  },

  {
    path: "/tenants/:slug",
    element: withSuspense(
      <ProtectedRoute roles={["ADMIN"]}>
        <TenantsPage />
      </ProtectedRoute>
    )
  },

  {
    path: "/simulate",
    element: withSuspense(
      <ProtectedRoute roles={["ADMIN"]}>
        <SimulatePage />
      </ProtectedRoute>
    )
  },

  {
    path: "/shipments",
    element: withSuspense(
      <ProtectedRoute roles={["ADMIN"]}>
        <ShipmentsPage />
      </ProtectedRoute>
    )
  },

  {
    path: "/users",
    element: withSuspense(
      <ProtectedRoute permissions={["users:manage"]}>
        <UsersPage />
      </ProtectedRoute>
    )
  },

  {
    path: "/empresa/dashboard",
    element: withSuspense(
      <ProtectedRoute roles={["TENANT_USER"]}>
        <EmpresaDashboard />
      </ProtectedRoute>
    )
  },

  {
    path: "/empresa/cotizar",
    element: withSuspense(
      <ProtectedRoute permissions={["shipping:calculate"]}>
        <EmpresaCotizar />
      </ProtectedRoute>
    )
  },

  {
    path: "/empresa/envios",
    element: withSuspense(
      <ProtectedRoute permissions={["shipping:read"]}>
        <EmpresaEnvios />
      </ProtectedRoute>
    )
  },

  {
    path: "/empresa/ciudades",
    element: withSuspense(
      <ProtectedRoute permissions={["locations:read"]}>
        <EmpresaCiudades />
      </ProtectedRoute>
    )
  },

  {
    path: "/empresa/couriers",
    element: withSuspense(
      <ProtectedRoute permissions={["config:read"]}>
        <EmpresaCouriers />
      </ProtectedRoute>
    )
  },

  {
    path: "/empresa/config",
    element: withSuspense(
      <ProtectedRoute permissions={["config:read"]}>
        <EmpresaConfig />
      </ProtectedRoute>
    )
  },

  {
    path: "/empresa/api",
    element: withSuspense(
      <ProtectedRoute permissions={["config:read"]}>
        <EmpresaApi />
      </ProtectedRoute>
    )
  },

  {
    path: "/empresa/historial",
    element: withSuspense(
      <ProtectedRoute permissions={["shipping:read"]}>
        <EmpresaHistorial />
      </ProtectedRoute>
    )
  },

  {
    path: "/empresa/docs",
    element: withSuspense(
      <ProtectedRoute permissions={["config:read"]}>
        <EmpresaDocs />
      </ProtectedRoute>
    )
  },

  {
    path: "/errors/unauthorized",
    element: withSuspense(<Unauthorized />)
  },
  {
    path: "/errors/forbidden",
    element: withSuspense(<Forbidden />)
  },
  {
    path: "/errors/not-found",
    element: withSuspense(<NotFound />)
  },
  {
    path: "/errors/internal-server-error",
    element: withSuspense(<InternalServerError />)
  },
  {
    path: "/errors/under-maintenance",
    element: withSuspense(<UnderMaintenance />)
  },

  {
    path: "/settings/appearance",
    element: withSuspense(<AppearanceSettings />)
  },

  {
    path: "*",
    element: withSuspense(<NotFound />)
  }
]
