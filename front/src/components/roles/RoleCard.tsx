import type { Role } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Shield, Users, CheckSquare, Calendar } from 'lucide-react'
import { useDeleteRoleMutation } from '@/store/api/rolesApi'

interface RoleCardProps {
  role: Role
  onEdit?: (role: Role) => void
}

export function RoleCard({ role, onEdit }: RoleCardProps) {
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation()

  const handleDelete = async () => {
    if (window.confirm(`Вы уверены, что хотите удалить роль ${role.name}?`)) {
      try {
        await deleteRole(role.id).unwrap()
      } catch (error) {
        console.error('Failed to delete role:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {role.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {role.chat?.title || 'Чат не найден'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{role.members?.length || 0} участников</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <span>{role.assignedTasks?.length || 0} задач</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Создана: {formatDate(role.createdAt)}</span>
        </div>
        
        <div className="pt-2">
          <Badge variant="outline">ID: {role.id}</Badge>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button
          onClick={() => onEdit?.(role)}
          variant="outline"
          className="flex-1"
        >
          Редактировать
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="destructive"
        >
          Удалить
        </Button>
      </CardFooter>
    </Card>
  )
}

