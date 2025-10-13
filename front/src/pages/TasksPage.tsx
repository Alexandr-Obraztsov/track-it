import React, { useState, useRef } from 'react';
import { useGetPersonalTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '../store/api/tasksApi';
import { useExtractTasksMutation } from '../store/api/geminiApi';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  CheckSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Search,
  Mic,
  MicOff,
  Type,
  Volume2
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState<CreateTaskRequest>({ title: '', description: '' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Временный userId - в реальном приложении должен браться из контекста авторизации
  const userId = '1';
  
  const { data: tasks = [], isLoading } = useGetPersonalTasksQuery(userId);
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [extractTasks] = useExtractTasksMutation();

  const filteredTasks = tasks.filter((task: Task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask(newTask).unwrap();
      setNewTask({ title: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    try {
      const updateData: UpdateTaskRequest = {
        title: editingTask.title,
        description: editingTask.description,
      };
      await updateTask({ id: editingTask.id.toString(), data: updateData }).unwrap();
      setEditingTask(null);
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      try {
        await deleteTask(taskId.toString()).unwrap();
      } catch (error) {
        console.error('Ошибка удаления задачи:', error);
      }
    }
  };


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudioInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Ошибка при записи аудио:', error);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audioData', audioBlob);
      formData.append('type', 'personal');
      formData.append('userId', userId);

      const result = await extractTasks({
        audioData: audioBlob,
        type: 'personal',
        userId: parseInt(userId)
      }).unwrap();

      console.log('Задачи извлечены из аудио:', result);
    } catch (error) {
      console.error('Ошибка обработки аудио:', error);
    }
  };

  const processTextInput = async () => {
    if (!textInput.trim()) return;

    try {
      const result = await extractTasks({
        text: textInput,
        type: 'personal',
        userId: parseInt(userId)
      }).unwrap();

      console.log('Задачи извлечены из текста:', result);
      setTextInput('');
      setShowTextInput(false);
    } catch (error) {
      console.error('Ошибка обработки текста:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Личные задачи</h1>
          <p className="text-gray-600 text-sm">
            Управляйте своими личными задачами
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => setShowCreateForm(true)} 
            className="flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать задачу
          </Button>
          <Button 
            onClick={() => setShowTextInput(!showTextInput)} 
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Type className="w-4 h-4" />
            Текстом
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "outline"}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                Остановить запись
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Голосом
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Text input for task creation */}
      {showTextInput && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Создать задачи из текста</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Введите описание задач... Например: 'Нужно купить молоко, позвонить маме, подготовить отчет'"
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={processTextInput} disabled={!textInput.trim()}>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Создать задачи
                </Button>
                <Button variant="outline" onClick={() => setShowTextInput(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Поиск задач..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create task form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Создать новую задачу</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Input
                  id="description"
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Создать</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tasks list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task: Task) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {task.assignedUser && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {task.assignedUser.firstName}
                        </span>
                      )}
                      {task.assignedRole && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          {task.assignedRole.title}
                        </span>
                      )}
                      {task.deadline && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                      {task.createdAt && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTask(task)}
                      className="p-1 h-8 w-8"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">Нет задач</h3>
              <p className="text-gray-600 text-sm mb-4">
                {searchTerm ? 'По вашему запросу ничего не найдено' : 'Создайте свою первую задачу'}
              </p>
              <Button onClick={() => setShowCreateForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Создать задачу
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit task modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Редактировать задачу</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Название</Label>
                  <Input
                    id="edit-title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Описание</Label>
                  <Input
                    id="edit-description"
                    value={editingTask.description || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Сохранить</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
