import { useState, useRef, useEffect } from 'react'
import { Plus, Mic as MicIcon, Type, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  onTextClick: () => void
  onVoiceRecordStart: () => void
  onVoiceRecordStop: () => void
  isRecording?: boolean
  audioLevel?: number
}

export function FloatingActionButton({ 
  onTextClick, 
  onVoiceRecordStart,
  onVoiceRecordStop,
  isRecording = false,
  audioLevel = 0
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const recordingStartedRef = useRef(false)
  const wasRecordingRef = useRef(false)

  // Закрываем меню после окончания записи
  useEffect(() => {
    if (wasRecordingRef.current && !isRecording) {
      // Запись закончилась - закрываем меню
      setIsOpen(false)
    }
    wasRecordingRef.current = isRecording
  }, [isRecording])

  const handleMainClick = () => {
    if (!isRecording) {
      setIsOpen(!isOpen)
    }
  }

  const handleTextClick = () => {
    setIsOpen(false)
    onTextClick()
  }

  const handleVoiceMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isRecording && !recordingStartedRef.current) {
      recordingStartedRef.current = true
      onVoiceRecordStart()
    }
  }

  const handleVoiceMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (recordingStartedRef.current) {
      recordingStartedRef.current = false
      onVoiceRecordStop()
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10 bg-background/50 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="relative flex flex-col items-center gap-3">
        {/* Text button - appears above */}
        <div
          className={cn(
            'transition-all duration-300 ease-out',
            isOpen 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-4 scale-50 pointer-events-none'
          )}
        >
          <button
            onClick={handleTextClick}
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center',
              'bg-primary/90 hover:bg-primary border-2 border-primary',
              'shadow-lg hover:shadow-xl transition-all duration-200',
              'active:scale-95 hover:scale-105',
              'group'
            )}
          >
            <Type className="h-5 w-5 text-primary-foreground" />
          </button>
          <div className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap">
            <div className="bg-card/95 backdrop-blur-sm border px-3 py-1.5 rounded-lg shadow-lg">
              <p className="text-xs text-foreground">Текст</p>
            </div>
          </div>
        </div>

        {/* Mic button - appears above main button - HOLD TO RECORD */}
        <div
          className={cn(
            'transition-all duration-300 ease-out',
            isOpen 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-4 scale-50 pointer-events-none'
          )}
        >
          <button
            onMouseDown={handleVoiceMouseDown}
            onMouseUp={handleVoiceMouseUp}
            onTouchStart={handleVoiceMouseDown}
            onTouchEnd={handleVoiceMouseUp}
            className={cn(
              'h-14 w-14 rounded-full flex items-center justify-center relative overflow-hidden',
              'shadow-lg transition-all duration-200',
              'active:scale-95',
              isRecording
                ? 'bg-destructive border-2 border-destructive scale-110 shadow-destructive/50'
                : 'bg-destructive/90 hover:bg-destructive border-2 border-destructive hover:scale-105'
            )}
          >
            {/* Ripple effect when recording */}
            {isRecording && (
              <>
                <span className="absolute inset-0 animate-ping bg-destructive rounded-full opacity-20"></span>
                <span 
                  className="absolute inset-0 rounded-full bg-destructive animate-pulse"
                  style={{ opacity: 0.3 }}
                ></span>
              </>
            )}
            
            <MicIcon 
              className={cn(
                'h-6 w-6 text-white transition-all relative z-10',
                isRecording && 'scale-110'
              )}
            />
          </button>
          <div className="absolute right-20 top-1/2 -translate-y-1/2 whitespace-nowrap">
            <div className="bg-card/95 backdrop-blur-sm border px-3 py-1.5 rounded-lg shadow-lg">
              <p className="text-xs text-foreground">
                {isRecording ? 'Идёт запись...' : 'Зажми для записи'}
              </p>
            </div>
          </div>
        </div>

        {/* Main FAB button */}
        <button
          onClick={handleMainClick}
          disabled={isRecording}
          className={cn(
            'h-16 w-16 rounded-full flex items-center justify-center relative',
            'shadow-xl transition-all duration-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isOpen
              ? 'bg-muted border-2 border-border rotate-45 scale-110'
              : 'bg-gradient-to-br from-primary to-primary/80 border-2 border-primary hover:shadow-2xl hover:scale-105',
            !isRecording && 'active:scale-95'
          )}
        >
          {isOpen ? (
            <X className="h-7 w-7 text-foreground -rotate-45 transition-transform" />
          ) : (
            <Plus className="h-7 w-7 text-primary-foreground transition-transform" />
          )}
          
          {/* Pulse animation when closed */}
          {!isOpen && !isRecording && (
            <span className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20" />
          )}
        </button>
      </div>
    </div>
  )
}

