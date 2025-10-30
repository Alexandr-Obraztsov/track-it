import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PenTool, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useExtractTasksMutation } from '@/store/api/geminiApi';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { tasksApi } from '@/store/api/tasksApi';

interface TextTaskButtonProps {
  className?: string;
}

export const TextTaskButton = ({ className }: TextTaskButtonProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; tasks?: string[] } | null>(null);
  
  const [extractTasks, { isLoading }] = useExtractTasksMutation();

  const handleSubmit = async () => {
    if (!text.trim() || !user) return;

    try {
      const formData = new FormData();
      formData.append('text', text.trim());
      formData.append('type', 'personal');
      formData.append('userId', user.id.toString());
      
      const response = await extractTasks(formData).unwrap();

      if (response.newTasks && response.newTasks.length > 0) {
        setResult({
          success: true,
          message: `Создано задач: ${response.newTasks.length}`,
          tasks: response.newTasks.map(task => task.title)
        });
        
        // Обновляем кэш задач
        dispatch(tasksApi.util.invalidateTags(['Task']));
        
        // Очищаем текст
        setText('');
      } else {
        setResult({
          success: false,
          message: 'Не удалось извлечь задачи из текста. Попробуйте переформулировать.'
        });
      }
    } catch (error) {
      console.error('Ошибка создания задач:', error);
      setResult({
        success: false,
        message: 'Произошла ошибка при создании задач'
      });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setText('');
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className={`h-14 w-14 rounded-lg shadow-xl transition-all duration-200 hover:scale-105 ${className}`}
        >
          <PenTool className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создать задачи</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Опишите ваши задачи..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !text.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создаю...
                  </>
                ) : (
                  'Создать задачи'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>

            {result.success && result.tasks && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Создано:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.tasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button onClick={handleClose}>
                Готово
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
