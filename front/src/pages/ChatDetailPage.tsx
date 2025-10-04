import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { useGetChatByIdQuery, useGetChatMembersQuery, useGetChatTasksQuery } from '@/store/api/chatsApi'
import { useGetRolesQuery } from '@/store/api/rolesApi'
import { cn } from '@/lib/utils'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDialog } from '@/components/tasks/TaskDialog'
import { UserCard } from '@/components/users/UserCard'
import { RoleCard } from '@/components/roles/RoleCard'
import type { Task } from '@/types'

type TabType = 'tasks' | 'members' | 'roles'

export function ChatDetailPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('tasks')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { data: chat, isLoading: chatLoading } = useGetChatByIdQuery(chatId!)
  const { data: tasks = [], isLoading: tasksLoading } = useGetChatTasksQuery(chatId!)
  const { data: members = [], isLoading: membersLoading } = useGetChatMembersQuery(chatId!)
  const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery({ chatId })

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  const handleCreateTask = () => {
    setSelectedTask(null)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedTask(null)
    }
  }

  if (chatLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    )
  }

  if (!chat) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-destructive text-sm">Чат не найден</p>
          <Link to="/chats">
            <Button variant="outline" size="sm" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к чатам
            </Button>
          </Link>
        </div>
      </Layout>
    )
  }

  const tabs = [
    { id: 'tasks' as TabType, label: 'Задачи', count: tasks.length },
    { id: 'members' as TabType, label: 'Участники', count: members.length },
    { id: 'roles' as TabType, label: 'Роли', count: roles.length },
  ]

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <Link to="/chats">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold">{chat.title}</h1>
            {chat.username && (
              <p className="text-sm text-muted-foreground">@{chat.username}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <span className="font-medium">{tab.label}</span>
              <Badge variant={activeTab === tab.id ? "secondary" : "outline"} className="text-xs">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-3">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Задачи чата</h2>
                <Button onClick={handleCreateTask} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {tasksLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">Задач пока нет</p>
                  <Button onClick={handleCreateTask} variant="outline" size="sm" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Создать задачу
                  </Button>
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                ))
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Участники чата</h2>

              {membersLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">Участников пока нет</p>
                </div>
              ) : (
                members.map((member) => 
                  member.user && <UserCard key={member.id} user={member.user} />
                )
              )}
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Роли чата</h2>

              {rolesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">Ролей пока нет</p>
                </div>
              ) : (
                roles.map((role) => (
                  <RoleCard key={role.id} role={role} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        task={selectedTask}
      />
    </Layout>
  )
}

