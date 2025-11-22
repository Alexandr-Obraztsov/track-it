import React from 'react';
import { IconButton as MuiIconButton } from '@mui/material';

export type IconButtonProps = React.ComponentProps<typeof MuiIconButton>;

export const IconButton: React.FC<IconButtonProps> = (props) => {
  return <MuiIconButton {...props} />;
};

