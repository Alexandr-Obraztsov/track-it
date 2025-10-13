import React, { useState } from 'react';
import { useGetTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '../store/api/api';
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
  Search
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const [editingTask, setEditingTask] = useState<any>(null);

  const { data: tasks = [], isLoading } = useGetTasksQuery();
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const filteredTasks = tasks.filter((task: any) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask(newTask).unwrap();
      setNewTask({ title: '', description: '', priority: 'medium' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    try {
      await updateTask({ id: editingTask.id, data: editingTask }).unwrap();
      setEditingTask(null);
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      try {
        await deleteTask(taskId).unwrap();
      } catch (error) {
        console.error('Ошибка удаления задачи:', error);
      }
    }
  };

  const toggleTaskStatus = async (task: any) => {
    try {
      await updateTask({ 
        id: task.id, 
        data: { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
      }).unwrap();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Не указан';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Задачи</h1>
          <p className="text-gray-600 text-sm">
            Управляйте своими задачами
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)} 
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Новая задача
        </Button>
      </div>

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
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="priority">Приоритет</Label>
                <select
                  id="priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
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
          filteredTasks.map((task: any) => (
            <Card key={task.id} className={`${task.status === 'completed' ? 'opacity-75' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTaskStatus(task)}
                    className="p-1 mt-0.5"
                  >
                    <CheckSquare className={`w-4 h-4 ${
                      task.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium text-sm ${
                      task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status === 'completed' ? '✓' : '○'}
                      </span>
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
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-priority">Приоритет</Label>
                  <select
                    id="edit-priority"
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
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
