import React from 'react';
import { Chip as MuiChip } from '@mui/material';

export type ChipProps = React.ComponentProps<typeof MuiChip>;

export const Chip: React.FC<ChipProps> = (props) => {
  return <MuiChip {...props} />;
};

