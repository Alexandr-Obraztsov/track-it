import type { Chat } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { MessageSquare, Users, Calendar, CheckSquare } from 'lucide-react'
import { useDeleteChatMutation } from '@/store/api/chatsApi'

interface ChatCardProps {
  chat: Chat
  onEdit?: (chat: Chat) => void
}

export function ChatCard({ chat, onEdit }: ChatCardProps) {
  const [deleteChat, { isLoading: isDeleting }] = useDeleteChatMutation()

  const handleDelete = async () => {
    if (window.confirm(`Вы уверены, что хотите удалить чат ${chat.title}?`)) {
      try {
        await deleteChat(chat.telegramId).unwrap()
      } catch (error) {
        console.error('Failed to delete chat:', error)
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
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base truncate leading-tight">
              {chat.title}
            </CardTitle>
            {chat.username && (
              <p className="text-sm text-muted-foreground">@{chat.username}</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 pt-0">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{chat.members?.length || 0}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <CheckSquare className="h-3 w-3 text-muted-foreground" />
            <span>{chat.tasks?.length || 0}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{formatDate(chat.createdAt)}</span>
          </div>
        </div>
        
        {chat.roles && chat.roles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chat.roles.slice(0, 3).map((role) => (
              <Badge key={role.id} variant="secondary" className="text-xs">
                {role.name}
              </Badge>
            ))}
            {chat.roles.length > 3 && (
              <Badge variant="outline" className="text-xs">+{chat.roles.length - 3}</Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-0">
        <Button
          onClick={() => onEdit?.(chat)}
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

