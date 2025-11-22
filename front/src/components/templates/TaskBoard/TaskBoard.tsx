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
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { TaskCard, type TaskCardProps } from '../../organisms/TaskCard';
import { TaskForm } from '../../organisms/TaskForm';
import { TaskDetailsDialog } from '../../organisms/TaskDetailsDialog';
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
    const task = tasks.find((t) => t.id === Number(active.id));
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
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      onStatusChange(taskId, newStatus);
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

  // Компонент для перетаскиваемой карточки
  const DraggableTaskCard = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: task.id.toString(),
      data: {
        type: 'task',
        task,
      },
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : undefined;

    const handleCardClick = (e: React.MouseEvent) => {
      // Предотвращаем открытие попапа при клике на кнопки действий
      const target = e.target as HTMLElement;
      if (target.closest('[data-task-actions]')) {
        return;
      }
      // Не открываем попап если это было перетаскивание
      if (isDragging) {
        return;
      }
      setSelectedTask(task);
      setOpenTaskDetails(true);
    };

    return (
      <Box
        ref={setNodeRef}
        style={style}
        onClick={handleCardClick}
        {...attributes}
        {...listeners}
        sx={{
          opacity: isDragging ? 0 : 1,
          visibility: isDragging ? 'hidden' : 'visible',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: isDragging ? 'none' : 'auto', // Отключаем стандартные жесты для лучшего контроля
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none', // Отключаем контекстное меню на iOS
        }}
      >
        <TaskCard {...convertTaskToCardProps(task)} />
      </Box>
    );
  };

  // Компонент для колонки с drop-зоной
  const Column = ({
    title,
    tasks: columnTasks,
    color,
    status,
    isCollapsed,
    onToggle,
  }: {
    title: string;
    tasks: Task[];
    color: string;
    status: 'backlog' | 'in_progress' | 'completed';
    isCollapsed: boolean;
    onToggle: () => void;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status,
    });

    return (
      <Box
        sx={{
          flex: 1,
          minWidth: { xs: '100%', md: 0 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          onClick={onToggle}
          sx={{
            mb: 2,
            pb: 1.5,
            borderBottom: '1.5px solid',
            borderColor: color,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'opacity 0.2s ease',
            '&:hover': {
              opacity: 0.8,
            },
            '&:active': {
              opacity: 0.6,
            },
          }}
        >
          <Box
            sx={{
              padding: 0.5,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& .MuiSvgIcon-root': {
                fontSize: '1rem',
              },
            }}
          >
            {isCollapsed ? <ExpandLess /> : <ExpandMore />}
          </Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: color,
              fontSize: '0.875rem',
              flex: 1,
              pointerEvents: 'none',
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
              pointerEvents: 'none',
            }}
          >
            {columnTasks.length}
          </Box>
        </Box>
        {!isCollapsed && (
          <Box
            ref={setNodeRef}
            sx={{
              flex: 1,
              minHeight: isOver ? 150 : 100,
              borderRadius: 2,
              p: isOver ? 1.5 : 1,
              backgroundColor: isOver ? `${color}15` : 'rgba(255, 255, 255, 0.02)',
              border: isOver ? `2px solid ${color}` : '2px dashed transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <Stack
              spacing={1.5}
              sx={{
                flex: 1,
                overflowY: { xs: 'visible', md: 'auto' },
                pr: { xs: 0, md: 0.5 },
                minHeight: isOver && columnTasks.length === 0 ? 120 : 100,
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
                    minHeight: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.875rem',
                    }}
                  >
                    Нет задач
                  </Typography>
                </Box>
              ) : (
                columnTasks.map((task) => (
                  <DraggableTaskCard key={task.id} task={task} />
                ))
              )}
            </Stack>
          </Box>
        )}
      </Box>
    );
  };

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[]}
      >
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
                status="backlog"
                isCollapsed={collapsedColumns.backlog}
                onToggle={() => toggleColumn('backlog')}
              />
              <Column
                title="В работе"
                tasks={inProgressTasks}
                color={theme.palette.primary.main}
                status="in_progress"
                isCollapsed={collapsedColumns.in_progress}
                onToggle={() => toggleColumn('in_progress')}
              />
              <Column
                title="Выполнено"
                tasks={completedTasks}
                color={theme.palette.success.main}
                status="completed"
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
                status="backlog"
                isCollapsed={collapsedColumns.backlog}
                onToggle={() => toggleColumn('backlog')}
              />
              <Column
                title="В работе"
                tasks={inProgressTasks}
                color={theme.palette.primary.main}
                status="in_progress"
                isCollapsed={collapsedColumns.in_progress}
                onToggle={() => toggleColumn('in_progress')}
              />
              <Column
                title="Выполнено"
                tasks={completedTasks}
                color={theme.palette.success.main}
                status="completed"
                isCollapsed={collapsedColumns.completed}
                onToggle={() => toggleColumn('completed')}
              />
            </Stack>
          )}
        </Box>
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

