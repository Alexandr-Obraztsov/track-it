import React from 'react';
import { useAppSelector } from '../hooks/redux';
import { useGetTasksQuery, useGetChatsQuery } from '../store/api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  CheckSquare, 
  MessageSquare, 
  TrendingUp,
  Plus,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery();
  const { data: chats = [], isLoading: chatsLoading } = useGetChatsQuery();

  const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
  const pendingTasks = tasks.filter((task: any) => task.status === 'pending').length;
  const activeChats = chats.filter((chat: any) => chat.isActive).length;

  const stats = [
    {
      title: 'Всего задач',
      value: tasks.length,
      icon: CheckSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Выполнено',
      value: completedTasks,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'В процессе',
      value: pendingTasks,
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Активные чаты',
      value: activeChats,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Welcome section */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Привет, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-600">
            Обзор ваших задач и активности
          </p>
        </div>
        <Button 
          onClick={() => navigate('/tasks')} 
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Новая задача
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="space-y-4">
        {/* Recent tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="w-4 h-4" />
              Последние задачи
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 3).map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{task.title}</p>
                      <p className="text-xs text-gray-600 truncate">{task.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
                      task.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status === 'completed' ? '✓' : '○'}
                    </span>
                  </div>
                ))}
                {tasks.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => navigate('/tasks')}
                  >
                    Показать все ({tasks.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Пока нет задач</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={() => navigate('/tasks')}
                >
                  Создать задачу
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent chats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-4 h-4" />
              Последние чаты
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chatsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : chats.length > 0 ? (
              <div className="space-y-2">
                {chats.slice(0, 3).map((chat: any) => (
                  <div key={chat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Чат #{chat.id}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
                      chat.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {chat.isActive ? '●' : '○'}
                    </span>
                  </div>
                ))}
                {chats.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => navigate('/chats')}
                  >
                    Показать все ({chats.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Пока нет чатов</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={() => navigate('/chats')}
                >
                  Начать чат
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
