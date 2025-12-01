import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TaskBoard } from '../components/templates/TaskBoard';
import type { Task } from '../types/api';
import { mockTasks, mockUsers, mockChats } from '../mocks/data';
import { tasksApi } from '../api/tasks';
import { chatsApi } from '../api/chats';
import { usersApi } from '../api/users';
import { labelsApi } from '../api/labels';
import { isMockMode } from '../utils/mockMode';
import type { Label } from '../types/api';

export const TaskBoardPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatTitle, setChatTitle] = useState<string>('');
  const [assignedUsers, setAssignedUsers] = useState(mockUsers);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isMockMode()) {
          // Используем моки
          const chat = mockChats.find((c) => c.id === Number(chatId));
          if (chat) {
            setChatTitle(chat.title);
            setTasks(chat.tasks || []);
          } else {
            setChatTitle('Группа');
            setTasks(mockTasks);
          }
          setAssignedUsers(mockUsers);
          setLoading(false);
        } else {
          // Загружаем с бекенда
          const chatIdNum = Number(chatId);
          
          // Загружаем чат для получения названия
          const chat = await chatsApi.getById(chatIdNum);
          setChatTitle(chat.title);
          
          // Загружаем задачи
          const tasksData = await tasksApi.getByChatId(chatIdNum);
          setTasks(tasksData);
          
          // Загружаем пользователей
          const usersData = await usersApi.getAll();
          setAssignedUsers(usersData);
          
          // Загружаем labels
          const labelsData = await labelsApi.getByChatId(chatIdNum);
          setLabels(labelsData);
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [chatId]);

  const handleStatusChange = async (taskId: number, status: 'backlog' | 'in_progress' | 'completed', assignedUserId?: number | null) => {
    if (isMockMode()) {
      // Моки: обновляем локально (уже обновлено оптимистично в TaskBoard)
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            const updatedTask = { ...task, status };
            if (assignedUserId !== undefined) {
              const assignedUser = assignedUsers.find(u => u.id === assignedUserId);
              updatedTask.assignedUserId = assignedUserId;
              updatedTask.assignedUser = assignedUser || null;
            }
            return updatedTask;
          }
          return task;
        })
      );
    } else {
      // Реальный API: обновляем на бекенде (уже обновлено оптимистично в TaskBoard)
      try {
        // Если нужно назначить пользователя, используем update вместо updateStatus
        if (assignedUserId !== undefined) {
          const updatedTask = await tasksApi.update(taskId, { status, assignedUserId });
          setTasks((prev) =>
            prev.map((task) => (task.id === taskId ? updatedTask : task))
          );
        } else {
        const updatedTask = await tasksApi.updateStatus(taskId, status);
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updatedTask : task))
        );
        }
      } catch (error) {
        console.error('Failed to update task status:', error);
        throw error; // Пробрасываем ошибку для отката в TaskBoard
      }
    }
  };

  const handleTaskEdit = async (taskId: number, task: Partial<Task>) => {
    if (isMockMode()) {
      // Моки: обновляем локально
      const label = labels.find((l) => l.id === task.labelId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...task, label: label || null } : t))
      );
    } else {
      // Реальный API: обновляем на бекенде
      try {
        const updatedTask = await tasksApi.update(taskId, task);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updatedTask : t))
        );
      } catch (error) {
        console.error('Failed to update task:', error);
        throw error;
      }
    }
  };

  const handleLabelsChange = async () => {
    // Перезагружаем labels после изменений
    if (!isMockMode()) {
      try {
        const chatIdNum = Number(chatId);
        const labelsData = await labelsApi.getByChatId(chatIdNum);
        setLabels(labelsData);
        
        // Обновляем все задачи, которые используют метки
        setTasks((prevTasks) =>
          prevTasks.map((task) => {
            if (task.labelId) {
              const updatedLabel = labelsData.find((l) => l.id === task.labelId);
              if (updatedLabel) {
                return {
                  ...task,
                  label: updatedLabel,
                };
              }
            }
            return task;
          })
        );
      } catch (error) {
        console.error('Failed to reload labels:', error);
      }
    } else {
      // В мок-режиме тоже обновляем задачи
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.labelId) {
            const updatedLabel = labels.find((l) => l.id === task.labelId);
            if (updatedLabel) {
              return {
                ...task,
                label: updatedLabel,
              };
            }
          }
          return task;
        })
      );
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    if (isMockMode()) {
      // Моки: удаляем локально
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } else {
      // Реальный API: удаляем на бекенде
      try {
        await tasksApi.delete(taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch (error) {
        console.error('Failed to delete task:', error);
        throw error;
      }
    }
  };

  return (
    <TaskBoard
      chatId={Number(chatId) || 1}
      chatTitle={chatTitle}
      tasks={tasks}
      assignedUsers={assignedUsers}
      labels={labels}
      onStatusChange={handleStatusChange}
      onTaskEdit={handleTaskEdit}
      onTaskDelete={handleTaskDelete}
      loading={loading}
      onLabelsChange={handleLabelsChange}
    />
  );
};

