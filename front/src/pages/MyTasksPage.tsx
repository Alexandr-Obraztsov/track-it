import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Loader2 } from 'lucide-react'
import { useGetTasksQuery } from '@/store/api/tasksApi'
import { TaskDialog } from '@/components/tasks/TaskDialog'
import { TaskCheckbox } from '@/components/tasks/TaskCheckbox'
import { VoiceTaskCreator } from '@/components/voice/VoiceTaskCreator'
import { FloatingActionButton } from '@/components/voice/FloatingActionButton'
import type { Task } from '@/types'

export function MyTasksPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [shouldStartRecording, setShouldStartRecording] = useState(false)
  const [shouldStopRecording, setShouldStopRecording] = useState(false)
  
  const { data: tasks = [], isLoading, error, refetch } = useGetTasksQuery({ type: 'personal' })

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedTask(null)
    }
  }

  const handleVoiceTasksCreated = () => {
    refetch() // Обновляем список задач после голосового создания
  }

  const handleTextClick = () => {
    setSelectedTask(null)
    setDialogOpen(true)
  }

  const handleVoiceRecordStart = () => {
    setShouldStartRecording(true)
    setIsRecording(true)
  }

  const handleVoiceRecordStop = () => {
    setShouldStopRecording(true)
  }

  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording)
    if (!recording) {
      setShouldStartRecording(false)
      setShouldStopRecording(false)
    }
  }

  // Получаем userId из первой задачи или используем дефолтное значение
  // В реальном приложении это должно браться из контекста пользователя
  const userId = tasks[0]?.assignedUserId || '123456789'

  const activeTasks = tasks.filter((t) => !t.isCompleted)
  const completedTasks = tasks.filter((t) => t.isCompleted)

  const stats = {
    total: tasks.length,
    active: activeTasks.length,
    completed: completedTasks.length,
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Мои задачи</h1>
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

        {/* Tasks List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive text-sm">Ошибка загрузки задач</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Задач пока нет</p>
            <p className="text-muted-foreground text-xs mt-2">Нажмите + или 🎤 внизу</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Tasks */}
            {activeTasks.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Активные</h2>
                <div className="space-y-1">
                  {activeTasks.map((task) => (
                    <TaskCheckbox key={task.id} task={task} onEdit={handleEditTask} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Завершённые</h2>
                <div className="space-y-1">
                  {completedTasks.map((task) => (
                    <TaskCheckbox key={task.id} task={task} onEdit={handleEditTask} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        task={selectedTask}
        isPersonal={true}
      />

      {/* Floating Action Button with voice recording */}
      <FloatingActionButton
        onTextClick={handleTextClick}
        onVoiceRecordStart={handleVoiceRecordStart}
        onVoiceRecordStop={handleVoiceRecordStop}
        isRecording={isRecording}
      />

      {/* Voice Task Creator - always mounted to handle recording */}
      <VoiceTaskCreator 
        userId={userId}
        onTasksCreated={handleVoiceTasksCreated}
        onCancel={() => {}}
        shouldStartRecording={shouldStartRecording}
        shouldStopRecording={shouldStopRecording}
        onRecordingStateChange={handleRecordingStateChange}
      />
    </Layout>
  )
}

