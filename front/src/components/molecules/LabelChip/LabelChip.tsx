import React from 'react';
import { Chip, Box } from '@mui/material';
import type { Label } from '../../../types/api';

export interface LabelChipProps {
  label: Label;
  size?: 'small' | 'medium';
}

export const LabelChip: React.FC<LabelChipProps> = ({ label, size = 'medium' }) => {
  return (
    <Chip
      label={label.name}
      size={size}
      sx={{
        height: size === 'small' ? 20 : 24,
        fontSize: size === 'small' ? '0.625rem' : '0.75rem',
        fontWeight: 500,
        backgroundColor: label.color || 'rgba(255, 255, 255, 0.1)',
        color: label.color ? '#fff' : 'text.primary',
        border: label.color ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
        '& .MuiChip-label': {
          px: size === 'small' ? 0.75 : 1,
        },
      }}
      icon={
        label.color ? (
          <Box
            sx={{
              width: size === 'small' ? 8 : 10,
              height: size === 'small' ? 8 : 10,
              borderRadius: '50%',
              backgroundColor: label.color,
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          />
        ) : undefined
      }
    />
  );
};

