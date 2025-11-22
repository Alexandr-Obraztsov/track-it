import React from 'react';
import { Box, Typography, Tabs, Tab, Stack } from '@mui/material';
import { TaskCard } from '../TaskCard';
import type { TaskCardProps } from '../TaskCard';

export interface TaskListProps {
  tasks: TaskCardProps[];
  onStatusChange?: (id: number, status: 'backlog' | 'in_progress' | 'completed') => void;
  onEdit?: (id: number) => void;
  onComment?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onStatusChange,
  onEdit,
  onComment,
  onDelete,
}) => {
  const [tabValue, setTabValue] = React.useState(0);

  const backlogTasks = tasks.filter((task) => task.status === 'backlog');
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress');
  const completedTasks = tasks.filter((task) => task.status === 'completed');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getCurrentTasks = () => {
    switch (tabValue) {
      case 0:
        return backlogTasks;
      case 1:
        return inProgressTasks;
      case 2:
        return completedTasks;
      default:
        return [];
    }
  };

  const currentTasks = getCurrentTasks();

  return (
    <Box>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{
          mb: 4,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            minHeight: 48,
            px: 3,
          },
        }}
      >
        <Tab
          label={`Очередь (${backlogTasks.length})`}
          sx={{
            '&.Mui-selected': {
              color: 'text.primary',
            },
          }}
        />
        <Tab
          label={`В работе (${inProgressTasks.length})`}
          sx={{
            '&.Mui-selected': {
              color: 'primary.main',
            },
          }}
        />
        <Tab
          label={`Выполнено (${completedTasks.length})`}
          sx={{
            '&.Mui-selected': {
              color: 'success.main',
            },
          }}
        />
      </Tabs>

      {currentTasks.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            px: 2,
          }}
        >
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              opacity: 0.6,
              fontWeight: 500,
            }}
          >
            Нет задач в этой категории
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              opacity: 0.5,
            }}
          >
            {tabValue === 0 && 'Создайте новую задачу, чтобы начать работу'}
            {tabValue === 1 && 'Переместите задачи из очереди, чтобы начать работу над ними'}
            {tabValue === 2 && 'Выполненные задачи будут отображаться здесь'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2.5}>
          {currentTasks.map((task) => (
            <TaskCard
              key={task.id}
              {...task}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onComment={onComment}
              onDelete={onDelete}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};
