import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { UserCard } from '@/components/users/UserCard'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { useGetUsersQuery } from '@/store/api/usersApi'
import type { User } from '@/types'

export function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  const { data: users = [], isLoading, error } = useGetUsersQuery()

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    // TODO: Открыть диалог редактирования
  }

  const stats = {
    total: users.length,
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Пользователи</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Всего</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold text-blue-600">
              {users.filter((u) => u.personalNotificationPreset !== 'off').length}
            </div>
            <p className="text-xs text-muted-foreground">С уведомл.</p>
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive text-sm">Ошибка загрузки</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Пользователи не найдены</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <UserCard key={user.telegramId} user={user} onEdit={handleEditUser} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

