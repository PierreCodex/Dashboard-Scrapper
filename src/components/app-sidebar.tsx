"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Truck,
  Building2,
  Calculator,
  Package,
  Settings,
  AlertTriangle,
  Users,
  MapPin,
  Code,
  History,
  BookOpen,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Logo } from "@/components/logo"
import { SidebarNotification } from "@/components/sidebar-notification"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAdmin, hasPermission, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const adminNavGroups = [
    {
      label: "Principal",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Administración",
      items: [
        {
          title: "Couriers",
          url: "#",
          icon: Truck,
          items: [
            {
              title: "Shalom",
              url: "/couriers/shalom",
            },
            {
              title: "Olva",
              url: "/couriers/olva",
            },
            {
              title: "Urbano",
              url: "/couriers/urbano",
            },
            {
              title: "Scharff",
              url: "/couriers/scharff",
            },
          ],
        },
        {
          title: "Tenants",
          url: "#",
          icon: Building2,
          items: [
            {
              title: "Lyrium",
              url: "/tenants/lyrium",
            },
          ],
        },
        {
          title: "Cotizador Courier",
          url: "/simulate",
          icon: Calculator,
        },
        {
          title: "Envíos",
          url: "/shipments",
          icon: Package,
        },
        ...(hasPermission("users:manage") ? [{
          title: "Usuarios",
          url: "/users",
          icon: Users,
        }] : []),
      ],
    },
    {
      label: "Sistema",
      items: [
        {
          title: "Errores",
          url: "#",
          icon: AlertTriangle,
          items: [
            {
              title: "Unauthorized",
              url: "/errors/unauthorized",
            },
            {
              title: "Forbidden",
              url: "/errors/forbidden",
            },
            {
              title: "Not Found",
              url: "/errors/not-found",
            },
            {
              title: "Internal Server Error",
              url: "/errors/internal-server-error",
            },
            {
              title: "Under Maintenance",
              url: "/errors/under-maintenance",
            },
          ],
        },
        {
          title: "Settings",
          url: "#",
          icon: Settings,
          items: [
            {
              title: "Appearance",
              url: "/settings/appearance",
            },
          ],
        },
      ],
    },
  ]

  const tenantNavGroups = [
    {
      label: "Principal",
      items: [
        {
          title: "Dashboard",
          url: "/empresa/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Gestión",
      items: [
        ...(hasPermission("shipping:calculate") ? [{
          title: "Cotizar Envío",
          url: "/empresa/cotizar",
          icon: Calculator,
        }] : []),
        ...(hasPermission("shipping:read") ? [{
          title: "Historial",
          url: "/empresa/historial",
          icon: History,
        }] : []),
        ...(hasPermission("locations:read") ? [{
          title: "Mis Ciudades",
          url: "/empresa/ciudades",
          icon: MapPin,
        }] : []),
        ...(hasPermission("config:read") ? [{
          title: "Mis Couriers",
          url: "/empresa/couriers",
          icon: Truck,
        }] : []),
        ...(hasPermission("config:read") ? [{
          title: "API para mi Tienda",
          url: "/empresa/api",
          icon: Code,
        }] : []),
        ...(hasPermission("config:read") ? [{
          title: "Docs API",
          url: "/empresa/docs",
          icon: BookOpen,
        }] : []),
        ...(hasPermission("config:read") ? [{
          title: "Configuración",
          url: "/empresa/config",
          icon: Settings,
        }] : []),
      ],
    },
  ]

  const navGroups = isAdmin ? adminNavGroups : tenantNavGroups
  const sidebarTitle = isAdmin ? "Scrapper Admin" : (user?.tenantName || "Empresa")
  const sidebarSubtitle = isAdmin ? "Logistics Dashboard" : (user?.tenantSlug || "")

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={isAdmin ? "/dashboard" : "/empresa/dashboard"}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{sidebarTitle}</span>
                  <span className="truncate text-xs">{sidebarSubtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items as any} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        <NavUser 
          user={{ 
            name: user?.name || "Usuario", 
            email: user?.email || "",
            avatar: "" 
          }} 
          onLogout={handleLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
