import { Empty } from '@/components/Empty';
import { PageHeader } from '@/components/PageHeader';
import { TaskCard } from '@/components/TaskCard';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { CheckSquare, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppSelector } from '@/hooks/redux';
import { useGetPersonalTasksQuery, useDeleteTaskMutation } from '@/store/api/tasksApi';

const TasksPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const userId = user?.id.toString() || '';
  
  const { data: tasks, isLoading, error } = useGetPersonalTasksQuery(userId, {
    skip: !userId,
  });
  
  const [deleteTask] = useDeleteTaskMutation();

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId.toString()).unwrap();
    } catch (err) {
      console.error('Ошибка удаления задачи:', err);
    }
  };

  return (
    <>
      <PageHeader
        title="Задачи"
        description="Ваши личные задачи"
      />

      <div className="container mx-auto p-6 space-y-4 max-w-2xl">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">
              Ошибка загрузки задач
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && tasks && tasks.length === 0 && (
          <Empty
            icon={CheckSquare}
            title="Нет задач"
            description="Используйте кнопку микрофона внизу справа, чтобы создать задачу голосом"
          />
        )}

        {!isLoading && !error && tasks && tasks.length > 0 && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Кнопка голосовой записи */}
      <VoiceRecordButton />
    </>
  );
};

export default TasksPage;

