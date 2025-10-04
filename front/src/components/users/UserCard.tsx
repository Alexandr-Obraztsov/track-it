import type { User } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Mail, User as UserIcon, Calendar, Bell } from 'lucide-react'
import { useDeleteUserMutation } from '@/store/api/usersApi'

interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
}

export function UserCard({ user, onEdit }: UserCardProps) {
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()

  const handleDelete = async () => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя ${user.firstName}?`)) {
      try {
        await deleteUser(user.telegramId).unwrap()
      } catch (error) {
        console.error('Failed to delete user:', error)
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
    <Card className="transition-all active:scale-98">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight">
              {user.firstName} {user.lastName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 pt-0">
        <div className="flex items-center gap-2 text-xs">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground truncate">{user.telegramId}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {user.personalNotificationPreset}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {user.groupNotificationPreset}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-0">
        <Button
          onClick={() => onEdit?.(user)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Изменить
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="destructive"
          size="sm"
        >
          Удалить
        </Button>
      </CardFooter>
    </Card>
  )
}

