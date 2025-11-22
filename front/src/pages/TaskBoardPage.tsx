import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TaskBoard } from '../components/templates/TaskBoard';
import type { Task } from '../types/api';
import { mockTasks, mockUsers, mockChats } from '../mocks/data';

export const TaskBoardPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatTitle, setChatTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Загрузить задачи с бекенда
    // Пока используем моки
    const chat = mockChats.find((c) => c.id === Number(chatId));
    if (chat) {
      setChatTitle(chat.title);
      setTasks(chat.tasks || []);
    } else {
      setChatTitle('Группа');
      setTasks(mockTasks);
    }
    setLoading(false);
  }, [chatId]);

  const handleStatusChange = (taskId: number, status: 'backlog' | 'in_progress' | 'completed') => {
    // TODO: Обновить статус на бекенде
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status } : task))
    );
  };

  const handleTaskCreate = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    // TODO: Создать задачу на бекенде
    const newTask: Task = {
      ...task,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleTaskEdit = async (taskId: number, task: Partial<Task>) => {
    // TODO: Обновить задачу на бекенде
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...task } : t))
    );
  };

  const handleTaskDelete = async (taskId: number) => {
    // TODO: Удалить задачу на бекенде
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <TaskBoard
      chatId={Number(chatId) || 1}
      chatTitle={chatTitle}
      tasks={tasks}
      assignedUsers={mockUsers}
      onStatusChange={handleStatusChange}
      onTaskCreate={handleTaskCreate}
      onTaskEdit={handleTaskEdit}
      onTaskDelete={handleTaskDelete}
      loading={loading}
    />
  );
};

