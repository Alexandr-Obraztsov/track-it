import { TaskCard } from '@/components/TaskCard';
import { TaskActionButtons } from '@/components/TaskActionButtons';
import { CheckSquare, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetPersonalTasksQuery, useDeleteTaskMutation } from '@/store/api/tasksApi';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useSwipeable } from 'react-swipeable';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

const TasksPage = () => {
    
  const { data: tasks, isLoading, error } = useGetPersonalTasksQuery();
  
  const [deleteTask] = useDeleteTaskMutation();
  const [activeTab, setActiveTab] = useState('todo');

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId.toString()).unwrap();
    } catch (err) {
      console.error('Ошибка удаления задачи:', err);
    }
  };

  // Разделяем задачи на активные и выполненные
  const todoTasks = tasks?.filter(task => task.status !== 'completed') || [];
  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];

  // Обработчики свайпов
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === 'todo') {
        setActiveTab('completed');
      }
    },
    onSwipedRight: () => {
      if (activeTab === 'completed') {
        setActiveTab('todo');
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 30, // минимальное расстояние для срабатывания свайпа
  });

  return (
    <div className="flex-1 flex flex-col" {...swipeHandlers}>
      <div className="container mx-auto p-6 space-y-4 max-w-2xl flex-1 flex flex-col">
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

        {!isLoading && !error && tasks && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="todo" className="flex items-center gap-2">
                To do ({todoTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                Completed ({completedTasks.length})
              </TabsTrigger>
            </TabsList>
            
            <LayoutGroup>
              <div className="flex-1 flex flex-col min-h-0">
                <TabsContent value="todo" className="mt-4 flex-1 overflow-y-auto data-[state=inactive]:hidden">
                  <div className="space-y-4 pb-4">
                    <AnimatePresence mode="popLayout">
                      {todoTasks.length > 0 ? (
                        todoTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onDelete={handleDeleteTask}
                          />
                        ))
                      ) : (
                        <motion.div
                          key="todo-empty"
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card>
                          <Empty className="border-dashed">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <CheckSquare />
                              </EmptyMedia>
                              <EmptyTitle>
                                {tasks.length === 0 ? "Нет задач" : "Нет активных задач"}
                              </EmptyTitle>
                              <EmptyDescription>
                                {tasks.length === 0 
                                  ? "Используйте кнопку микрофона внизу справа, чтобы создать задачу голосом" 
                                  : "Все задачи выполнены! 🎉"
                                }
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </TabsContent>
                
                <TabsContent value="completed" className="mt-4 flex-1 overflow-y-auto data-[state=inactive]:hidden">
                  <div className="space-y-4 pb-4">
                    <AnimatePresence mode="popLayout">
                      {completedTasks.length > 0 ? (
                        completedTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onDelete={handleDeleteTask}
                          />
                        ))
                      ) : (
                        <motion.div
                          key="completed-empty"
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card>
                          <Empty className="border-dashed">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <CheckSquare />
                              </EmptyMedia>
                              <EmptyTitle>Нет выполненных задач</EmptyTitle>
                            </EmptyHeader>
                          </Empty>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </TabsContent>
              </div>
            </LayoutGroup>
          </Tabs>
        )}
      </div>

      {/* Кнопки действий */}
      <TaskActionButtons />
    </div>
  );
};

export default TasksPage;

