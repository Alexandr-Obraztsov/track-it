import { useState } from 'react'
import { VoiceRecorder } from './VoiceRecorder'
import { Button } from '../ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '../ui/badge'

interface VoiceTaskCreatorProps {
  userId: string
  onTasksCreated?: () => void
  onCancel?: () => void
  shouldStartRecording?: boolean
  shouldStopRecording?: boolean
  onRecordingStateChange?: (isRecording: boolean) => void
}

interface ProcessedTask {
  id: number
  title: string
  description?: string
  deadline?: string
  isCompleted: boolean
}

interface VoiceResponse {
  success: boolean
  message: string
  tasks?: {
    created: ProcessedTask[]
    updated: ProcessedTask[]
    deleted: number[]
  }
}

export function VoiceTaskCreator({ 
  userId, 
  onTasksCreated, 
  onCancel,
  shouldStartRecording = false,
  shouldStopRecording = false,
  onRecordingStateChange
}: VoiceTaskCreatorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [response, setResponse] = useState<VoiceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError(null)
    setResponse(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('userId', userId)

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const res = await fetch(`${apiUrl}/voice/process`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Не удалось обработать голосовое сообщение')
      }

      const data: VoiceResponse = await res.json()
      setResponse(data)

      // Если задачи были созданы/обновлены, вызываем колбэк
      if (data.tasks && (data.tasks.created.length > 0 || data.tasks.updated.length > 0)) {
        onTasksCreated?.()
      }
    } catch (err) {
      console.error('Error processing voice:', err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setResponse(null)
    setError(null)
    onCancel?.() // Возвращаемся к FAB кнопке
  }

  return (
    <>
      {/* Voice Recorder - управляется через props */}
      <VoiceRecorder 
        userId={userId} 
        onRecordingComplete={handleRecordingComplete}
        isProcessing={isProcessing}
        isOpen={false}
        shouldStartRecording={shouldStartRecording}
        shouldStopRecording={shouldStopRecording}
        onRecordingStateChange={onRecordingStateChange}
      />

      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold text-lg">Обрабатываю запись</p>
                <p className="text-sm text-muted-foreground mt-1">AI анализирует ваше сообщение...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Ошибка</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={handleReset} variant="outline" className="w-full">
                Попробовать снова
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success overlay */}
      {response && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border rounded-2xl p-8 shadow-2xl max-w-sm mx-4 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">Готово!</p>
                  <p className="text-sm text-muted-foreground mt-1">{response.message}</p>
                </div>
              </div>

              {response.tasks && (
                <div className="space-y-3">
                  {response.tasks.created.length > 0 && (
                    <div className="space-y-2">
                      <Badge variant="default">Создано: {response.tasks.created.length}</Badge>
                      <div className="space-y-2">
                        {response.tasks.created.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 rounded-lg border bg-card text-sm"
                          >
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {response.tasks.updated.length > 0 && (
                    <Badge variant="secondary">Обновлено: {response.tasks.updated.length}</Badge>
                  )}

                  {response.tasks.deleted.length > 0 && (
                    <Badge variant="destructive">Удалено: {response.tasks.deleted.length}</Badge>
                  )}
                </div>
              )}

              <Button onClick={handleReset} className="w-full">
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

