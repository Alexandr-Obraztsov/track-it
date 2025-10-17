import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useExtractTasksMutation } from '@/store/api/geminiApi';
import { useAppSelector } from '@/hooks/redux';

export const VoiceRecordButton = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [isRecording, setIsRecording] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [extractTasks, { isLoading }] = useExtractTasksMutation();

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        // Отправляем аудио
        await sendAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Запускаем таймер
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setResult({
        success: false,
        message: 'Не удалось получить доступ к микрофону'
      });
      setShowResult(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setRecordingTime(0);
    }
  };

  const sendAudio = async (audioBlob: Blob) => {
    if (!user) return;

    setShowResult(true);

    try {
      const formData = new FormData();
      formData.append('type', 'personal');
      formData.append('userId', user.id.toString());
      formData.append('audioData', audioBlob, 'recording.webm');

      const response = await extractTasks(formData as any).unwrap();
      
      const newTasksCount = response.newTasks?.length || 0;
      const updatedTasksCount = response.updatedTasks?.length || 0;
      
      let message = '';
      if (newTasksCount > 0) {
        message += `Создано задач: ${newTasksCount}`;
      }
      if (updatedTasksCount > 0) {
        if (message) message += ', ';
        message += `Обновлено задач: ${updatedTasksCount}`;
      }
      if (!message) {
        message = 'Задачи не найдены в записи';
      }

      setResult({
        success: true,
        message: message
      });
    } catch (err: any) {
      console.error('Error sending audio:', err);
      
      let errorMessage = 'Ошибка обработки аудио';
      
      if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (typeof err?.data === 'string') {
        errorMessage = err.data;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setResult({
        success: false,
        message: errorMessage
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startRecording();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    stopRecording();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startRecording();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    stopRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setResult(null);
  };

  return (
    <>
      {/* Плавающая кнопка */}
      <div className="fixed bottom-20 right-6 z-40">
        <Button
          size="lg"
          variant={isRecording ? 'destructive' : 'default'}
          className={`h-14 w-14 rounded-full shadow-xl transition-all duration-200 ${
            isRecording ? 'scale-110 ring-4 ring-destructive/20' : 'hover:scale-105'
          }`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={stopRecording}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={isLoading}
        >
          <Mic className="h-6 w-6" />
        </Button>

        {/* Индикатор записи */}
        {isRecording && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-card border border-border rounded-md px-4 py-2 shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-mono font-medium text-foreground">
                {formatTime(recordingTime)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Попап с результатом */}
      <Dialog open={showResult} onOpenChange={handleCloseResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isLoading ? 'Обработка аудио...' : result?.success ? 'Готово!' : 'Ошибка'}
            </DialogTitle>
            <DialogDescription>
              {isLoading ? 'Gemini анализирует вашу запись' : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  Пожалуйста, подождите...
                </p>
              </div>
            )}

            {!isLoading && result && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {result.success ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                  )}
                </div>

                <Alert 
                  variant={result.success ? 'default' : 'destructive'}
                  className={result.success ? 'border-primary/50 bg-primary/10' : 'border-destructive/50 bg-destructive/10'}
                >
                  <AlertDescription className={result.success ? 'text-foreground' : 'text-destructive'}>
                    {result.message}
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center">
                  <Button onClick={handleCloseResult}>
                    Закрыть
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

