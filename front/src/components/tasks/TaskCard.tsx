import type { Task } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Calendar, CheckCircle2, Clock, User, Users } from 'lucide-react'
import { useCompleteTaskMutation, useDeleteTaskMutation } from '@/store/api/tasksApi'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [completeTask, { isLoading: isCompleting }] = useCompleteTaskMutation()
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation()

  const handleComplete = async () => {
    try {
      await completeTask(task.id).unwrap()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      try {
        await deleteTask(task.id).unwrap()
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.isCompleted

  return (
    <Card className={cn(
      "transition-all active:scale-98",
      task.isCompleted && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              <Badge variant={task.type === 'personal' ? 'default' : 'secondary'} className="text-xs">
                {task.type === 'personal' ? 'Личная' : 'Группа'}
              </Badge>
              {task.isCompleted && (
                <Badge variant="success" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Готово
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Просрочена
                </Badge>
              )}
            </div>
            <CardTitle className={cn(
              "text-base leading-tight",
              task.isCompleted && "line-through"
            )}>
              {task.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-muted-foreground">{task.readableId}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {task.description && (
        <CardContent className="pt-0 pb-3">
          <CardDescription className="text-sm line-clamp-2">
            {task.description}
          </CardDescription>
        </CardContent>
      )}
      
      <CardFooter className="flex flex-col gap-3 pt-0">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground w-full">
          {task.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.deadline)}</span>
            </div>
          )}
          
          {task.assignedUser && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{task.assignedUser.firstName}</span>
            </div>
          )}
          
          {task.assignedRole && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{task.assignedRole.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 w-full">
          {!task.isCompleted && (
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              variant="default"
              size="sm"
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => onEdit?.(task)}
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
        </div>
      </CardFooter>
    </Card>
  )
}

