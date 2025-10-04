import { useState, useRef, useEffect } from 'react'
import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
  userId: string
  isProcessing?: boolean
  isOpen?: boolean
  onClose?: () => void
  shouldStartRecording?: boolean
  shouldStopRecording?: boolean
  onRecordingStateChange?: (isRecording: boolean) => void
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  isProcessing, 
  isOpen = true, 
  onClose,
  shouldStartRecording = false,
  shouldStopRecording = false,
  onRecordingStateChange
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Effect to handle external start recording command
  useEffect(() => {
    if (shouldStartRecording && !isRecording && !isProcessing) {
      startRecording()
    }
  }, [shouldStartRecording])

  // Effect to handle external stop recording command
  useEffect(() => {
    if (shouldStopRecording && isRecording) {
      stopRecording()
    }
  }, [shouldStopRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Настраиваем анализатор звука для визуализации громкости
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser
      
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      // Запускаем анимацию уровня звука
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateAudioLevel = () => {
        if (!analyserRef.current) return
        
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalizedLevel = Math.min(average / 128, 1) // Нормализуем от 0 до 1
        setAudioLevel(normalizedLevel)
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }
      updateAudioLevel()
      
      // Используем webm для лучшей совместимости
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onRecordingComplete(audioBlob)
        
        // Останавливаем анализатор
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
        
        // Останавливаем все треки
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        
        // Сбрасываем состояние
        setIsRecording(false)
        setRecordingTime(0)
        setAudioLevel(0)
        onRecordingStateChange?.(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      onRecordingStateChange?.(true)

      // Запускаем таймер
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 100) // Обновляем каждые 100мс для плавности
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Не удалось получить доступ к микрофону')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isProcessing && !isRecording && isOpen) {
      startRecording()
      onClose?.()
    }
  }

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (isRecording) {
      stopRecording()
    }
  }

  const formatTime = (time: number) => {
    const seconds = Math.floor(time / 10)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen && !isRecording) {
    return null
  }

  return (
    <>
      {/* Recording indicator - таймер слева от микрофона */}
      {isRecording && (
        <div className="fixed bottom-20 right-24 z-50 pointer-events-none animate-in fade-in slide-in-from-right-2 duration-200">
          <div className="bg-destructive/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </div>
            <span className="text-white font-mono text-sm font-semibold">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      )}

      {/* Floating button - по правому краю снизу */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 pointer-events-none">
          <div className="relative pointer-events-auto">
            
            <button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            disabled={isProcessing}
            className={cn(
              'h-16 w-16 rounded-full flex items-center justify-center',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'relative overflow-hidden border-2',
              'transition-all duration-75',
              isRecording 
                ? 'bg-destructive border-destructive shadow-destructive/50' 
                : 'bg-card border-border hover:border-primary/50 active:scale-95'
            )}
            style={{
              transform: isRecording ? `scale(${1.1 + audioLevel * 0.3})` : undefined,
              boxShadow: isRecording 
                ? `0 0 ${20 + audioLevel * 30}px rgba(239, 68, 68, ${0.3 + audioLevel * 0.4})` 
                : undefined
            }}
          >
            {/* Пульсирующие волны от громкости */}
            {isRecording && audioLevel > 0.1 && (
              <>
                <span 
                  className="absolute inset-0 rounded-full bg-destructive"
                  style={{
                    opacity: audioLevel * 0.3,
                    transform: `scale(${1 + audioLevel * 2})`,
                    transition: 'all 0.1s ease-out'
                  }}
                ></span>
                <span 
                  className="absolute inset-0 rounded-full bg-destructive animate-ping"
                  style={{
                    opacity: audioLevel * 0.2,
                    animationDuration: '1s'
                  }}
                ></span>
              </>
            )}
            
            <Mic 
              className={cn(
                'transition-all relative z-10',
                isRecording 
                  ? 'text-white' 
                  : 'text-primary'
              )}
              style={{
                width: isRecording ? `${24 + audioLevel * 6}px` : '24px',
                height: isRecording ? `${24 + audioLevel * 6}px` : '24px',
                transition: 'all 0.1s ease-out'
              }}
            />
          </button>
        </div>
        </div>
      )}
    </>
  )
}

