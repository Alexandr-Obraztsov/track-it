import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { TaskCard, type TaskCardProps } from '../../organisms/TaskCard';
import { TaskForm } from '../../organisms/TaskForm';
import { TaskDetailsDialog } from '../../organisms/TaskDetailsDialog';
import { DraggableTaskCard } from '../../organisms/DraggableTaskCard';
import { TaskBoardHeader } from '../../molecules/TaskBoardHeader';
import { TaskBoardContent } from './TaskBoardContent';
import type { Task, User } from '../../../types/api';
import { authApi } from '../../../api/auth';

export interface TaskBoardProps {
  chatId: number;
  chatTitle: string;
  tasks: Task[];
  assignedUsers?: User[];
  onStatusChange?: (taskId: number, status: 'backlog' | 'in_progress' | 'completed') => void;
  onTaskCreate?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onTaskEdit?: (taskId: number, task: Partial<Task>) => void;
  onTaskDelete?: (taskId: number) => void;
  onTaskComment?: (taskId: number) => void;
  loading?: boolean;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  chatId,
  chatTitle,
  tasks,
  assignedUsers = [],
  onStatusChange,
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
  onTaskComment,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [openForm, setOpenForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [openTaskDetails, setOpenTaskDetails] = useState(false);
  
  // Локальное состояние задач для оптимистичного обновления
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  
  // Синхронизируем локальное состояние с пропсами
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  
  // Состояние сворачивания колонок
  const getCollapsedStateKey = () => `taskBoard_collapsed_${chatId}`;
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(getCollapsedStateKey());
    return saved ? JSON.parse(saved) : { backlog: false, in_progress: false, completed: false };
  });

  // Загружаем текущего пользователя
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const profile = await authApi.getProfile();
        setCurrentUser({
          id: profile.id,
          telegramId: profile.telegramId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          photoUrl: profile.photoUrl,
          createdAt: profile.createdAt || new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  // Сохраняем состояние сворачивания в localStorage
  useEffect(() => {
    localStorage.setItem(getCollapsedStateKey(), JSON.stringify(collapsedColumns));
  }, [collapsedColumns, chatId]);

  const toggleColumn = (columnKey: string) => {
    setCollapsedColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // Фильтруем задачи по текущему пользователю
  const filteredTasks = showOnlyMyTasks && currentUser
    ? localTasks.filter((task) => task.assignedUser?.id === currentUser.id)
    : localTasks;

  const backlogTasks = filteredTasks.filter((t) => t.status === 'backlog');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  const handleCreateTask = () => {
    setEditingTask(null);
    setOpenForm(true);
  };

  const handleSaveTask = async (taskData: any) => {
    if (editingTask) {
      // Оптимистичное обновление для редактирования
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: taskData.title,
                description: taskData.description || null,
                assignedUserId: taskData.assignedUserId || null,
                deadline: taskData.deadline ? taskData.deadline.toISOString() : null,
              }
            : t
        )
      );
      try {
        await onTaskEdit?.(editingTask.id, taskData);
      } catch (error) {
        console.error('Failed to update task:', error);
        // Откатываем изменения в случае ошибки
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? editingTask : t))
        );
      }
    } else {
      // Для создания задачи просто вызываем callback
      await onTaskCreate?.({
        title: taskData.title,
        description: taskData.description || null,
        assignedUserId: taskData.assignedUserId || null,
        assignedRoleId: null,
        deadline: taskData.deadline ? taskData.deadline.toISOString() : null,
        status: 'backlog',
      });
    }
    setOpenForm(false);
    setEditingTask(null);
  };

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Настройка сенсоров для drag-and-drop
  // Используем разные сенсоры для мобильных и десктопа
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // На десктопе активируем после движения мыши на 8px
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      // На мобильных используем задержку 300ms с допуском 8px
      // Это позволяет отличить перетаскивание от прокрутки
      activationConstraint: {
        delay: 300,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find((t) => t.id === Number(active.id));
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !onStatusChange) return;

    const taskId = Number(active.id);
    const overId = over.id.toString();

    // Проверяем, что over.id - это статус колонки (backlog, in_progress, completed)
    const validStatuses: ('backlog' | 'in_progress' | 'completed')[] = ['backlog', 'in_progress', 'completed'];
    if (!validStatuses.includes(overId as any)) {
      return;
    }

    const newStatus = overId as 'backlog' | 'in_progress' | 'completed';

    // Проверяем, что статус действительно изменился
    const task = localTasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      // Оптимистичное обновление: сразу обновляем локальное состояние
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      
      // Асинхронно синхронизируем с сервером
      Promise.resolve(onStatusChange(taskId, newStatus)).catch((error: any) => {
        console.error('Failed to update task status:', error);
        // В случае ошибки откатываем изменения
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
        );
      });
    }
  };

  const convertTaskToCardProps = (task: Task): TaskCardProps => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    assignedUser: task.assignedUser
      ? {
          id: task.assignedUser.id,
          firstName: task.assignedUser.firstName,
          lastName: task.assignedUser.lastName,
          username: task.assignedUser.username,
        }
      : null,
    deadline: task.deadline,
    onEdit: handleEditTask,
    onComment: onTaskComment,
    onDelete: onTaskDelete,
  });

  const handleEditTask = (taskId: number) => {
    const task = localTasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setOpenForm(true);
    }
  };

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setOpenTaskDetails(true);
  };

  const renderTask = (task: Task) => (
    <DraggableTaskCard
      key={task.id}
      task={task}
      cardProps={convertTaskToCardProps(task)}
      onCardClick={handleCardClick}
    />
  );

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      <TaskBoardHeader
        chatTitle={chatTitle}
        tasksCount={filteredTasks.length}
        showOnlyMyTasks={showOnlyMyTasks}
        onToggleFilter={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
        isMobile={isMobile}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[]}
      >
        <TaskBoardContent
          backlogTasks={backlogTasks}
          inProgressTasks={inProgressTasks}
          completedTasks={completedTasks}
          collapsedColumns={collapsedColumns}
          onToggleColumn={toggleColumn}
          renderTask={renderTask}
        />
        <DragOverlay
          style={{
            cursor: 'grabbing',
          }}
        >
          {activeTask ? (
            <Box
              sx={{
                opacity: 0.9,
                transform: 'rotate(2deg)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <TaskCard {...convertTaskToCardProps(activeTask)} />
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="add task"
        onClick={handleCreateTask}
        sx={{
          position: 'fixed',
          bottom: 72,
          right: 16,
          zIndex: 1000,
          width: 56,
          height: 56,
          '& .MuiSvgIcon-root': {
            fontSize: '1.5rem',
          },
        }}
      >
        <Add />
      </Fab>

      {/* Task Form */}
      <TaskForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        initialData={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description || '',
                assignedUserId: editingTask.assignedUserId,
                deadline: editingTask.deadline ? new Date(editingTask.deadline) : null,
              }
            : undefined
        }
        assignedUsers={assignedUsers}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        open={openTaskDetails}
        task={selectedTask}
        onClose={() => {
          setOpenTaskDetails(false);
          setSelectedTask(null);
        }}
        onEdit={handleEditTask}
        onDelete={onTaskDelete}
        onComment={onTaskComment}
      />
    </Box>
  );
};

