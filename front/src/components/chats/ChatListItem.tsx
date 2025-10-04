import { Link } from 'react-router-dom'
import type { Chat } from '@/types'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { MessageSquare, Users, CheckSquare, ChevronRight } from 'lucide-react'

interface ChatListItemProps {
  chat: Chat
}

export function ChatListItem({ chat }: ChatListItemProps) {
  return (
    <Link to={`/chats/${chat.telegramId}`}>
      <Card className="transition-all active:scale-98 hover:bg-accent/50">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate leading-tight">
                {chat.title}
              </h3>
              {chat.username && (
                <p className="text-sm text-muted-foreground">@{chat.username}</p>
              )}
              
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{chat.members?.length || 0}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  <span>{chat.tasks?.length || 0}</span>
                </div>

                {chat.roles && chat.roles.length > 0 && (
                  <div className="flex gap-1">
                    {chat.roles.slice(0, 2).map((role) => (
                      <Badge key={role.id} variant="secondary" className="text-xs py-0">
                        {role.name}
                      </Badge>
                    ))}
                    {chat.roles.length > 2 && (
                      <Badge variant="outline" className="text-xs py-0">
                        +{chat.roles.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

