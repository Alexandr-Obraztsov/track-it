import React from 'react';
import { Chip, alpha } from '@mui/material';
import type { Theme } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, HourglassEmpty } from '@mui/icons-material';

export interface StatusChipProps {
  status: 'backlog' | 'in_progress' | 'completed';
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          label: 'Выполнено',
          icon: <CheckCircle sx={{ fontSize: '0.875rem' }} />,
          sx: {
            backgroundColor: (theme: Theme) => alpha(theme.palette.success.main, 0.15),
            color: 'success.main',
            border: '1px solid',
            borderColor: (theme: Theme) => alpha(theme.palette.success.main, 0.3),
            fontWeight: 500,
            '&:hover': {
              backgroundColor: (theme: Theme) => alpha(theme.palette.success.main, 0.25),
            },
          },
        };
      case 'in_progress':
        return {
          label: 'В работе',
          icon: <HourglassEmpty sx={{ fontSize: '0.875rem' }} />,
          sx: {
            backgroundColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.15),
            color: 'primary.main',
            border: '1px solid',
            borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.3),
            fontWeight: 500,
            '&:hover': {
              backgroundColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.25),
            },
          },
        };
      default:
        return {
          label: 'Очередь',
          icon: <RadioButtonUnchecked sx={{ fontSize: '0.875rem' }} />,
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            },
          },
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={config.label}
      icon={config.icon}
      size={size}
      sx={config.sx}
    />
  );
};
