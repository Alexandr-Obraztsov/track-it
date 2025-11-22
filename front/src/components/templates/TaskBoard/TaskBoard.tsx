import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Fab,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  ExpandMore,
  ExpandLess,
  FilterList,
} from '@mui/icons-material';
import { TaskCard, type TaskCardProps } from '../../organisms/TaskCard';
import { TaskForm } from '../../organisms/TaskForm';
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
    ? tasks.filter((task) => task.assignedUser?.id === currentUser.id)
    : tasks;

  const backlogTasks = filteredTasks.filter((t) => t.status === 'backlog');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  const handleCreateTask = () => {
    setEditingTask(null);
    setOpenForm(true);
  };

  const handleEditTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setOpenForm(true);
    }
  };

  const handleSaveTask = (taskData: any) => {
    if (editingTask) {
      onTaskEdit?.(editingTask.id, taskData);
    } else {
      onTaskCreate?.({
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
    onStatusChange: onStatusChange,
    onEdit: handleEditTask,
    onComment: onTaskComment,
    onDelete: onTaskDelete,
  });

  const Column = ({
    title,
    tasks: columnTasks,
    color,
    isCollapsed,
    onToggle,
  }: {
    title: string;
    tasks: Task[];
    color: string;
    isCollapsed: boolean;
    onToggle: () => void;
  }) => (
    <Box
      sx={{
        flex: 1,
        minWidth: { xs: '100%', md: 0 },
        display: 'flex',
        flexDirection: 'column',
        maxHeight: { xs: 'none', md: 'calc(100vh - 250px)' },
      }}
    >
      <Box
        sx={{
          mb: 2,
          pb: 1.5,
          borderBottom: '1.5px solid',
          borderColor: color,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconButton
          size="small"
          onClick={onToggle}
          sx={{
            padding: 0.5,
            color: color,
            '&:hover': {
              backgroundColor: `${color}15`,
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1rem',
            },
          }}
        >
          {isCollapsed ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: color,
            fontSize: '0.875rem',
            flex: 1,
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1.5,
            backgroundColor: `${color}20`,
            color: color,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {columnTasks.length}
        </Box>
      </Box>
      {!isCollapsed && (
        <Stack
          spacing={1.5}
          sx={{
            flex: 1,
            overflowY: { xs: 'visible', md: 'auto' },
            pr: { xs: 0, md: 0.5 },
            // Скрываем скроллбар, но оставляем возможность прокрутки
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE и Edge
            '&::-webkit-scrollbar': {
              display: 'none', // Chrome, Safari, Opera
            },
          }}
        >
          {columnTasks.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px dashed',
                borderColor: 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: '0.875rem' }}
              >
                Нет задач
              </Typography>
            </Box>
          ) : (
            columnTasks.map((task) => (
              <TaskCard key={task.id} {...convertTaskToCardProps(task)} />
            ))
          )}
        </Stack>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      {/* Title Section */}
      <Box
        sx={{
          p: 2,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '1rem',
            color: 'text.primary',
          }}
        >
          {chatTitle}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            size="small"
            onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
            sx={{
              padding: 0.5,
              color: showOnlyMyTasks ? 'primary.main' : 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1rem',
              },
            }}
            title={showOnlyMyTasks ? 'Показать все задачи' : 'Показать только мои задачи'}
          >
            <FilterList />
          </IconButton>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.75rem' }}
          >
            {filteredTasks.length}
          </Typography>
        </Box>
      </Box>

      {/* Board */}
             <Box
               sx={{
                 flex: 1,
                 overflow: { xs: 'auto', md: 'hidden' },
                 p: { xs: 2, sm: 2.5 },
               }}
             >
        {isMobile ? (
          // Mobile: Vertical stack
          <Stack spacing={2}>
            <Column
              title="Очередь"
              tasks={backlogTasks}
              color="rgba(255, 255, 255, 0.5)"
              isCollapsed={collapsedColumns.backlog}
              onToggle={() => toggleColumn('backlog')}
            />
            <Column
              title="В работе"
              tasks={inProgressTasks}
              color={theme.palette.primary.main}
              isCollapsed={collapsedColumns.in_progress}
              onToggle={() => toggleColumn('in_progress')}
            />
            <Column
              title="Выполнено"
              tasks={completedTasks}
              color={theme.palette.success.main}
              isCollapsed={collapsedColumns.completed}
              onToggle={() => toggleColumn('completed')}
            />
          </Stack>
        ) : (
          // Desktop: Horizontal columns
          <Stack
            direction="row"
            spacing={2}
            sx={{
              width: '100%',
              height: '100%',
              alignItems: 'flex-start',
            }}
          >
            <Column
              title="Очередь"
              tasks={backlogTasks}
              color="rgba(255, 255, 255, 0.5)"
              isCollapsed={collapsedColumns.backlog}
              onToggle={() => toggleColumn('backlog')}
            />
            <Column
              title="В работе"
              tasks={inProgressTasks}
              color={theme.palette.primary.main}
              isCollapsed={collapsedColumns.in_progress}
              onToggle={() => toggleColumn('in_progress')}
            />
            <Column
              title="Выполнено"
              tasks={completedTasks}
              color={theme.palette.success.main}
              isCollapsed={collapsedColumns.completed}
              onToggle={() => toggleColumn('completed')}
            />
          </Stack>
        )}
      </Box>

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
    </Box>
  );
};

