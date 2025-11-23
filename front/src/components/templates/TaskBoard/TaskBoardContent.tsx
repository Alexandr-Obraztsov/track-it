import React from 'react';
import {
  Box,
  Stack,
} from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import type { Task } from '../../../types/api';
import { TaskColumn } from '../../organisms/TaskColumn';

export interface TaskBoardContentProps {
  backlogTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  collapsedColumns: Record<string, boolean>;
  onToggleColumn: (columnKey: string) => void;
  renderTask: (task: Task) => React.ReactNode;
}

export const TaskBoardContent: React.FC<TaskBoardContentProps> = ({
  backlogTasks,
  inProgressTasks,
  completedTasks,
  collapsedColumns,
  onToggleColumn,
  renderTask,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        flex: 1,
        overflow: { xs: 'auto', md: 'hidden' },
        p: { xs: 2, sm: 2.5 },
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 'auto', md: '100%' }, // На ПК на всю высоту
      }}
    >
      {isMobile ? (
        <Stack spacing={2}>
          <TaskColumn
            title="Очередь"
            tasks={backlogTasks}
            color="rgba(255, 255, 255, 0.5)"
            status="backlog"
            isCollapsed={collapsedColumns.backlog}
            onToggle={() => onToggleColumn('backlog')}
            renderTask={renderTask}
          />
          <TaskColumn
            title="В работе"
            tasks={inProgressTasks}
            color={theme.palette.primary.main}
            status="in_progress"
            isCollapsed={collapsedColumns.in_progress}
            onToggle={() => onToggleColumn('in_progress')}
            renderTask={renderTask}
          />
          <TaskColumn
            title="Выполнено"
            tasks={completedTasks}
            color={theme.palette.success.main}
            status="completed"
            isCollapsed={collapsedColumns.completed}
            onToggle={() => onToggleColumn('completed')}
            renderTask={renderTask}
          />
        </Stack>
      ) : (
        <Stack
          direction="row"
          spacing={2}
          sx={{
            width: '100%',
            height: '100%', // На ПК на всю высоту
            alignItems: 'stretch', // Растягиваем колонки по высоте
          }}
        >
          <TaskColumn
            title="Очередь"
            tasks={backlogTasks}
            color="rgba(255, 255, 255, 0.5)"
            status="backlog"
            isCollapsed={collapsedColumns.backlog}
            onToggle={() => onToggleColumn('backlog')}
            renderTask={renderTask}
          />
          <TaskColumn
            title="В работе"
            tasks={inProgressTasks}
            color={theme.palette.primary.main}
            status="in_progress"
            isCollapsed={collapsedColumns.in_progress}
            onToggle={() => onToggleColumn('in_progress')}
            renderTask={renderTask}
          />
          <TaskColumn
            title="Выполнено"
            tasks={completedTasks}
            color={theme.palette.success.main}
            status="completed"
            isCollapsed={collapsedColumns.completed}
            onToggle={() => onToggleColumn('completed')}
            renderTask={renderTask}
          />
        </Stack>
      )}
    </Box>
  );
};
