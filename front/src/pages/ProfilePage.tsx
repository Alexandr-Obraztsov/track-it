import React from 'react';
import { useAppSelector } from '../hooks/redux';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  User, 
  Mail, 
  Calendar, 
  Settings,
  Edit
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
          <p className="text-gray-600 text-sm">
            Управление настройками профиля
          </p>
        </div>
        <Button variant="outline" className="w-full flex items-center justify-center gap-2">
          <Edit className="w-4 h-4" />
          Редактировать
        </Button>
      </div>

      <div className="space-y-4">
        {/* Basic info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4" />
              Основная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              {user?.photo_url && (
                <img 
                  src={user.photo_url} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </h3>
                {user?.username && (
                  <p className="text-gray-600 text-sm">@{user.username}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700">ID пользователя</label>
                <p className="text-gray-900 text-sm">{user?.id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Имя</label>
                <p className="text-gray-900 text-sm">{user?.first_name}</p>
              </div>
              {user?.last_name && (
                <div>
                  <label className="text-xs font-medium text-gray-700">Фамилия</label>
                  <p className="text-gray-900 text-sm">{user.last_name}</p>
                </div>
              )}
              {user?.username && (
                <div>
                  <label className="text-xs font-medium text-gray-700">Username</label>
                  <p className="text-gray-900 text-sm">@{user.username}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-700">Дата авторизации</label>
                <p className="text-gray-900 text-sm">{user?.auth_date ? formatDate(user.auth_date) : 'Не указана'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="w-4 h-4" />
              Настройки аккаунта
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Уведомления</h4>
                  <p className="text-xs text-gray-600">О новых задачах</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Настроить
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Тема</h4>
                  <p className="text-xs text-gray-600">Светлая тема</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Изменить
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Язык</h4>
                  <p className="text-xs text-gray-600">Русский</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Изменить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Статус аккаунта</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Статус</span>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Активен
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Тип аккаунта</span>
                <span className="text-sm font-medium">Бесплатный</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Дата регистрации</span>
                <span className="text-sm font-medium">
                  {user?.auth_date ? formatDate(user.auth_date) : 'Не указана'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Поддержка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-sm">
              <Mail className="w-4 h-4 mr-2" />
              Связаться с поддержкой
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              Запланировать звонок
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
