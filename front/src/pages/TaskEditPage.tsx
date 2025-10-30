import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calendar, 
  CheckCircle2, 
  Clock,
  AlertCircle 
} from 'lucide-react';
import { useGetTaskByIdQuery, useUpdateTaskMutation } from '@/store/api/tasksApi';
import { type TaskStatus } from '@/types/api';
import { motion } from 'framer-motion';

const TaskEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: task, isLoading, error } = useGetTaskByIdQuery(id!);
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'backlog' as TaskStatus,
    dueDate: '',
  });
  
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (task) {
      const newFormData = {
        title: task.title || '',
        description: task.description || '',
        status: task.status,
        dueDate: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      };
      setFormData(newFormData);
    }
  }, [task]);

  useEffect(() => {
    if (task) {
      const hasChanged = 
        formData.title !== (task.title || '') ||
        formData.description !== (task.description || '') ||
        formData.status !== task.status ||
        formData.dueDate !== (task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
      
      setHasChanges(hasChanged);
    }
  }, [formData, task]);

  const handleSave = async () => {
    if (!task || !hasChanges) return;

    try {
      await updateTask({
        id: task.id.toString(),
        data: {
          title: formData.title,
          description: formData.description || undefined,
          deadline: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        }
      }).unwrap();
      
      navigate('/tasks');
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };


  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'Выполнена';
      case 'in_progress':
        return 'В процессе';
      default:
        return 'В ожидании';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Задача не найдена или произошла ошибка при загрузке
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/tasks')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к задачам
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col"
    >
      {/* Хедер */}
      <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-6 py-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tasks')}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Редактирование задачи</h1>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isUpdating}
              size="sm"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6 max-w-2xl space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название задачи</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название задачи"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Добавьте описание задачи (необязательно)"
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Статус и дата */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(formData.status)}
                      {getStatusLabel(formData.status)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      В ожидании
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      В процессе
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Выполнена
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Срок выполнения</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default TaskEditPage;
