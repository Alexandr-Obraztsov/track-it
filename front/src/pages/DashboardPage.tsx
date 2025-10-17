import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckSquare, MessageSquare, Clock } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';
import { useGetPersonalTasksQuery } from '@/store/api/tasksApi';
import { useGetChatsQuery } from '@/store/api/chatsApi';

const DashboardPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const userId = user?.id.toString() || '';
  
  const { data: tasks, isLoading: tasksLoading } = useGetPersonalTasksQuery(userId, {
    skip: !userId,
  });
  
  const { data: chats, isLoading: chatsLoading } = useGetChatsQuery();

  const isLoading = tasksLoading || chatsLoading;

  // Подсчет задач с дедлайном на сегодня/завтра
  const getUpcomingTasks = () => {
    if (!tasks) return 0;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return deadline <= tomorrow;
    }).length;
  };

  return (
    <>
      <PageHeader
        title="Дашборд"
        description="Обзор ваших задач и активности"
      />

      <div className="container mx-auto p-6 space-y-6 max-w-2xl">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Личные задачи
                </CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {tasks?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tasks?.length === 1 ? 'задача' : 'задач'} в работе
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Активные чаты
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {chats?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {chats?.length === 1 ? 'чат' : 'чатов'} доступно
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Срочные задачи
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {getUpcomingTasks()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getUpcomingTasks() === 1 ? 'задача' : 'задач'} требует внимания сегодня или завтра
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardPage;

