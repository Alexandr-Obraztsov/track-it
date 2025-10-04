import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDialog } from '@/components/tasks/TaskDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, Filter } from 'lucide-react'
import { useGetTasksQuery } from '@/store/api/tasksApi'
import type { Task } from '@/types'

export function TasksPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'all' | 'personal' | 'group' | 'completed'>('all')
  
  const { data: tasks = [], isLoading, error } = useGetTasksQuery({})

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedTask(null)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedTask(null)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true
    if (filter === 'personal') return task.type === 'personal'
    if (filter === 'group') return task.type === 'group'
    if (filter === 'completed') return task.isCompleted
    return true
  })

  const stats = {
    total: tasks.length,
    personal: tasks.filter((t) => t.type === 'personal').length,
    group: tasks.filter((t) => t.type === 'group').length,
    completed: tasks.filter((t) => t.isCompleted).length,
    active: tasks.filter((t) => !t.isCompleted).length,
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Задачи</h1>
          <Button onClick={handleCreateNew} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Активных</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Готово</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xl font-bold text-purple-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Всего</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Badge
            variant={filter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('all')}
          >
            Все
          </Badge>
          <Badge
            variant={filter === 'personal' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('personal')}
          >
            Личные
          </Badge>
          <Badge
            variant={filter === 'group' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('group')}
          >
            Групповые
          </Badge>
          <Badge
            variant={filter === 'completed' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter('completed')}
          >
            Завершенные
          </Badge>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive text-sm">Ошибка загрузки задач</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Задачи не найдены</p>
            <Button onClick={handleCreateNew} variant="outline" size="sm" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Создать задачу
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
            ))}
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        task={selectedTask}
      />
    </Layout>
  )
}

