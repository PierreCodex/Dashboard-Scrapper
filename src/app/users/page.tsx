"use client"

import { useState } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { useUsers, useToggleUser, useUpdateUserPermissions, useCreateUser, type User } from "@/hooks/useUsers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Shield } from "lucide-react"

const ALL_PERMISSIONS = [
  "shipping:calculate",
  "shipping:create",
  "shipping:read",
  "locations:read",
  "config:read",
  "config:write",
  "agencies:sync",
  "users:manage",
]

function PermissionsDialog({ user, open, onOpenChange }: { user: User; open: boolean; onOpenChange: (open: boolean) => void }) {
  const updatePermissions = useUpdateUserPermissions()
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(user.permissions)

  const handleSave = async () => {
    try {
      await updatePermissions.mutateAsync({ userId: user.id, permissions: selectedPermissions })
      toast.success("Permisos actualizados")
      onOpenChange(false)
    } catch {
      toast.error("Error al actualizar permisos")
    }
  }

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Permisos - {user.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {ALL_PERMISSIONS.map((perm) => (
            <div key={perm} className="flex items-center justify-between">
              <Label>{perm}</Label>
              <Switch
                checked={selectedPermissions.includes(perm)}
                onCheckedChange={() => togglePermission(perm)}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updatePermissions.isPending}>
            {updatePermissions.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createUser = useCreateUser()
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "TENANT_USER" as "ADMIN" | "TENANT_USER",
    tenantId: "",
  })

  const handleSubmit = async () => {
    try {
      await createUser.mutateAsync({
        ...form,
        tenantId: form.role === "TENANT_USER" ? form.tenantId || undefined : undefined,
      })
      toast.success("Usuario creado")
      onOpenChange(false)
      setForm({ email: "", password: "", name: "", role: "TENANT_USER", tenantId: "" })
    } catch {
      toast.error("Error al crear usuario")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "ADMIN" | "TENANT_USER" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="TENANT_USER">Tenant User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.role === "TENANT_USER" && (
            <div>
              <Label>Tenant ID</Label>
              <Input value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} placeholder="cmmn88vs50000vvm8v3hpjvcs" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createUser.isPending}>
            {createUser.isPending ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const { data: users, isLoading } = useUsers()
  const toggleUser = useToggleUser()
  const [permissionsDialogUser, setPermissionsDialogUser] = useState<User | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleToggle = async (user: User) => {
    try {
      await toggleUser.mutateAsync(user.id)
      toast.success(`Usuario ${user.isActive ? "desactivado" : "activado"}`)
    } catch {
      toast.error("Error al cambiar estado")
    }
  }

  return (
    <BaseLayout title="Usuarios" description="Gestión de usuarios del sistema">
      <div className="px-4 lg:px-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Permisos</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.tenantName || "-"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => handleToggle(user)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.slice(0, 3).map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                          {user.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{user.permissions.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setPermissionsDialogUser(user)}>
                          <Shield className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {permissionsDialogUser && (
          <PermissionsDialog
            user={permissionsDialogUser}
            open={!!permissionsDialogUser}
            onOpenChange={(open) => !open && setPermissionsDialogUser(null)}
          />
        )}

        <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </BaseLayout>
  )
}
