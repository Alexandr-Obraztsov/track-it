import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { RoleCard } from '@/components/roles/RoleCard'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { useGetRolesQuery } from '@/store/api/rolesApi'
import type { Role } from '@/types'

export function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  const { data: roles = [], isLoading, error } = useGetRolesQuery({})

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    // TODO: Открыть диалог редактирования
  }

  const stats = {
    total: roles.length,
    withMembers: roles.filter((r) => r.members && r.members.length > 0).length,
    withTasks: roles.filter((r) => r.assignedTasks && r.assignedTasks.length > 0).length,
    totalMembers: roles.reduce((sum, r) => sum + (r.members?.length || 0), 0),
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Роли</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Ролей</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold text-blue-600">{stats.withMembers}</div>
            <p className="text-xs text-muted-foreground">С юзерами</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold text-green-600">{stats.withTasks}</div>
            <p className="text-xs text-muted-foreground">С задачами</p>
          </div>
        </div>

        {/* Roles List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive text-sm">Ошибка загрузки</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Роли не найдены</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <RoleCard key={role.id} role={role} onEdit={handleEditRole} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

