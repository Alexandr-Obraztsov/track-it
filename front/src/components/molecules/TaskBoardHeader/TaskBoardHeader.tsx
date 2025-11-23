import React from 'react';
import {
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  FilterList,
} from '@mui/icons-material';

export interface TaskBoardHeaderProps {
  chatTitle: string;
  tasksCount: number;
  showOnlyMyTasks: boolean;
  onToggleFilter: () => void;
  isMobile?: boolean;
}

export const TaskBoardHeader: React.FC<TaskBoardHeaderProps> = ({
  chatTitle,
  tasksCount,
  showOnlyMyTasks,
  onToggleFilter,
  isMobile = false,
}) => {
  return (
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
        {!isMobile && (
          <IconButton
            size="small"
            onClick={onToggleFilter}
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
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: '0.75rem' }}
        >
          {tasksCount}
        </Typography>
      </Box>
    </Box>
  );
};

