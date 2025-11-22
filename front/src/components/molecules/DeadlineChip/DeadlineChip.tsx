import React from 'react';
import { Chip, alpha } from '@mui/material';
import type { Theme } from '@mui/material';
import { Schedule } from '@mui/icons-material';

export interface DeadlineChipProps {
  deadline: string;
  size?: 'small' | 'medium';
}

export const DeadlineChip: React.FC<DeadlineChipProps> = ({ deadline, size = 'small' }) => {
  const date = new Date(deadline);
  const isOverdue = date < new Date();
  const formattedDate = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Chip
      icon={<Schedule sx={{ fontSize: '0.875rem' }} />}
      label={formattedDate}
      size={size}
      sx={{
        backgroundColor: isOverdue
          ? (theme: Theme) => alpha(theme.palette.error.main, 0.15)
          : (theme: Theme) => alpha(theme.palette.warning.main, 0.1),
        color: isOverdue ? 'error.main' : 'warning.main',
        border: '1px solid',
        borderColor: isOverdue
          ? (theme: Theme) => alpha(theme.palette.error.main, 0.3)
          : (theme: Theme) => alpha(theme.palette.warning.main, 0.2),
        fontWeight: 500,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: isOverdue
            ? (theme: Theme) => alpha(theme.palette.error.main, 0.2)
            : (theme: Theme) => alpha(theme.palette.warning.main, 0.15),
          borderColor: isOverdue
            ? (theme: Theme) => alpha(theme.palette.error.main, 0.4)
            : (theme: Theme) => alpha(theme.palette.warning.main, 0.3),
        },
      }}
    />
  );
};
