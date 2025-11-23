import React from 'react';
import {
  Box,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import {
  useDroppable,
} from '@dnd-kit/core';
import type { Task } from '../../../types/api';

export interface TaskColumnProps {
  title: string;
  tasks: Task[];
  color: string;
  status: 'backlog' | 'in_progress' | 'completed';
  isCollapsed: boolean;
  onToggle: () => void;
  renderTask: (task: Task) => React.ReactNode;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  title,
  tasks: columnTasks,
  color,
  status,
  isCollapsed,
  onToggle,
  renderTask,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
        height: { xs: 'auto', md: '100%' }, // На ПК колонки на всю высоту
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
            borderRadius: 2,
            p: isOver ? 1.5 : 1,
            backgroundColor: isOver ? `${color}15` : 'rgba(255, 255, 255, 0.02)',
            border: isOver ? `2px solid ${color}` : '2px dashed transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: '100%' }, // На ПК на всю высоту
          }}
        >
          <Stack
            spacing={1.5}
            sx={{
              flex: 1,
              overflowY: { xs: 'visible', md: 'auto' },
              pr: { xs: 0, md: 0.5 },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            {columnTasks.length === 0 ? (
              isMobile ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 6,
                    px: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '2px dashed',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
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
                    {isOver ? 'Отпустите, чтобы добавить' : 'Нет задач'}
                  </Typography>
                </Box>
              ) : (
                isOver && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 6,
                      px: 3,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '2px dashed',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
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
                      Отпустите, чтобы добавить
                    </Typography>
                  </Box>
                )
              )
            ) : (
              columnTasks.map((task) => renderTask(task))
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

