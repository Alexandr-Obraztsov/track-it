import React from 'react';
import { Chip, alpha, Tooltip } from '@mui/material';
import type { Theme } from '@mui/material';
import { Person } from '@mui/icons-material';

export interface UserChipProps {
  firstName: string;
  lastName?: string | null;
  size?: 'small' | 'medium';
  maxLength?: number;
}

export const UserChip: React.FC<UserChipProps> = ({
  firstName,
  lastName,
  size = 'small',
  maxLength = 20,
}) => {
  const fullName = `${firstName} ${lastName || ''}`.trim();
  const displayName =
    fullName.length > maxLength
      ? `${fullName.substring(0, maxLength - 3)}...`
      : fullName;

  const chip = (
    <Chip
      icon={<Person sx={{ fontSize: '0.875rem', color: 'primary.main' }} />}
      label={displayName}
      size={size}
      sx={{
        backgroundColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
        color: 'text.primary',
        border: '1px solid',
        borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.2),
        fontWeight: 500,
        transition: 'all 0.2s ease',
        maxWidth: '100%',
        '& .MuiChip-label': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        '&:hover': {
          backgroundColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.15),
          borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.3),
        },
      }}
    />
  );

  // Показываем tooltip только если имя было обрезано
  if (fullName.length > maxLength) {
    return <Tooltip title={fullName}>{chip}</Tooltip>;
  }

  return chip;
};
