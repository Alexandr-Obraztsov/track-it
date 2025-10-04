import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { ChatCard } from '@/components/chats/ChatCard'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { useGetChatsQuery } from '@/store/api/chatsApi'
import type { Chat } from '@/types'

export function ChatsPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  
  const { data: chats = [], isLoading, error } = useGetChatsQuery()

  const handleEditChat = (chat: Chat) => {
    setSelectedChat(chat)
    // TODO: Открыть диалог редактирования
  }

  const stats = {
    total: chats.length,
    withTasks: chats.filter((c) => c.tasks && c.tasks.length > 0).length,
    totalMembers: chats.reduce((sum, c) => sum + (c.members?.length || 0), 0),
    totalRoles: chats.reduce((sum, c) => sum + (c.roles?.length || 0), 0),
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Чаты</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Чатов</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold text-blue-600">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Участников</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold text-green-600">{stats.withTasks}</div>
            <p className="text-xs text-muted-foreground">С задачами</p>
          </div>
        </div>

        {/* Chats List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive text-sm">Ошибка загрузки</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Чаты не найдены</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <ChatCard key={chat.telegramId} chat={chat} onEdit={handleEditChat} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

