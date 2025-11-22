import React from 'react';
import { Button as MuiButton } from '@mui/material';

export type ButtonProps = Omit<React.ComponentProps<typeof MuiButton>, 'variant'> & {
  variant?: 'contained' | 'outlined' | 'text';
};

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <MuiButton {...props}>{children}</MuiButton>;
};

