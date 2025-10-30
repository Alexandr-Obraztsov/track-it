import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { logout } from '@/store/slices/authSlice';
import { useGetPersonalTasksQuery } from '@/store/api/tasksApi';
import { 
  LogOut, 
  User as UserIcon, 
  AtSign, 
  Hash, 
  Calendar,
  Shield,
  Settings,
  Bell,
  Loader2
} from 'lucide-react';

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  // Получаем личные задачи пользователя
  const { data: personalTasks, isLoading: tasksLoading, error: tasksError } = useGetPersonalTasksQuery();

  const handleLogout = () => {
    dispatch(logout());
  };

  const getInitials = () => {
    if (!user) return '?';
    const firstName = user.first_name?.[0] || '';
    const lastName = user.last_name?.[0] || '';
    return `${firstName}${lastName}`.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
  };

  // Подсчет статистики задач
  const getTaskStats = () => {
    if (!personalTasks) {
      return { total: 0, completed: 0, inProgress: 0 };
    }

    const total = personalTasks.length;
    const completed = personalTasks.filter(task => task.status === 'completed').length;
    const inProgress = personalTasks.filter(task => task.status === 'backlog').length;

    return { total, completed, inProgress };
  };

  const taskStats = getTaskStats();

  return (
    <>
      <div className="container mx-auto p-4 space-y-4 max-w-4xl">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Карточка профиля */}
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserIcon className="h-4 w-4" />
                Профиль
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-16 w-16 border-2 border-primary/10">
                  <AvatarImage src={user?.photo_url} alt={user?.first_name} />
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">
                      {user?.first_name} {user?.last_name}
                    </h2>
                    {user?.username && (
                      <p className="text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs h-5">
                      <Shield className="h-3 w-3 mr-1" />
                      Telegram
                    </Badge>
                    <Badge variant="outline" className="text-xs h-5">
                      <Hash className="h-3 w-3 mr-1" />
                      ID: {user?.id}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <UserIcon className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Полное имя</p>
                    <p className="text-sm font-medium truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                  </div>
                </div>

                {user?.username && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <AtSign className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="text-sm font-medium truncate">@{user.username}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Карточка настроек */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-4 w-4" />
                Настройки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-9" disabled>
                <Bell className="h-3 w-3 mr-2" />
                Уведомления
                <Badge variant="secondary" className="ml-auto text-xs h-4">
                  Скоро
                </Badge>
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-9" disabled>
                <Settings className="h-3 w-3 mr-2" />
                Предпочтения
                <Badge variant="secondary" className="ml-auto text-xs h-4">
                  Скоро
                </Badge>
              </Button>
            </CardContent>
          </Card>

          {/* Карточка действий */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LogOut className="h-4 w-4" />
                Действия
              </CardTitle>
              <CardDescription>
              <Button 
                variant="destructive" 
                className="w-full h-9"
                onClick={handleLogout}
              >
                <LogOut className="h-3 w-3 mr-2" />
                Выйти из аккаунта
              </Button>
              </CardDescription>
            </CardHeader>
          </Card>

        </div>
      </div>
    </>
  );
};

export default ProfilePage;

