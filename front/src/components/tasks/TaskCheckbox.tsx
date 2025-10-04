import { useState } from 'react'
import type { Task } from '@/types'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Calendar, Clock, Trash2, Edit } from 'lucide-react'
import { useCompleteTaskMutation, useDeleteTaskMutation } from '@/store/api/tasksApi'
import { cn } from '@/lib/utils'

interface TaskCheckboxProps {
  task: Task
  onEdit?: (task: Task) => void
}

export function TaskCheckbox({ task, onEdit }: TaskCheckboxProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [completeTask, { isLoading: isCompleting }] = useCompleteTaskMutation()
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation()

  const handleToggle = async () => {
    if (task.isCompleted) return
    try {
      await completeTask(task.id).unwrap()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Удалить задачу?')) {
      try {
        await deleteTask(task.id).unwrap()
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(task)
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
    <Card 
      className={cn(
        "transition-all cursor-pointer",
        task.isCompleted && "opacity-60"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggle()
            }}
            disabled={isCompleting || task.isCompleted}
            className={cn(
              "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5",
              task.isCompleted
                ? "bg-primary border-primary"
                : "border-muted-foreground hover:border-primary"
            )}
          >
            {task.isCompleted && (
              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={cn(
                "text-sm font-medium leading-tight",
                task.isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleEdit}
                  className="p-1 hover:bg-accent rounded"
                >
                  <Edit className="h-3 w-3 text-muted-foreground" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 hover:bg-destructive/10 rounded"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">{task.readableId}</span>
              
              {task.deadline && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-destructive" : "text-muted-foreground"
                )}>
                  {isOverdue ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                  <span>{formatDate(task.deadline)}</span>
                </div>
              )}

              {isOverdue && (
                <Badge variant="destructive" className="text-xs py-0">
                  Просрочена
                </Badge>
              )}
            </div>

            {/* Expanded Description */}
            {isExpanded && task.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

