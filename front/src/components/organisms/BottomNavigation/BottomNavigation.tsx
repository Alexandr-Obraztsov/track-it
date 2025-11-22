import React from 'react';
import {
  Box,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Groups,
  Dashboard,
  Person,
} from '@mui/icons-material';

export type NavigationTab = 'groups' | 'board' | 'profile';

export interface BottomNavigationProps {
  value: NavigationTab;
  onChange: (value: NavigationTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  value,
  onChange,
}) => {

  const handleChange = (_event: React.SyntheticEvent, newValue: NavigationTab) => {
    onChange(newValue);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        width: 'auto',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Paper
        sx={{
          backgroundColor: 'rgba(30, 30, 30, 0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          borderRadius: '24px',
          overflow: 'hidden',
        }}
        elevation={0}
      >
        <MuiBottomNavigation
          value={value}
          onChange={handleChange}
          showLabels
          sx={{
            backgroundColor: 'transparent',
            height: 48,
            minWidth: 250,
            '& .MuiBottomNavigationAction-root': {
              color: 'rgba(255, 255, 255, 0.6)',
              minWidth: 0,
              maxWidth: 'none',
              padding: '4px 12px 6px',
              transition: 'color 0.15s ease',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.6rem',
              fontWeight: 400,
              mt: 0.25,
              lineHeight: 1.1,
              transition: 'all 0.15s ease',
              '&.Mui-selected': {
                fontSize: '0.6rem',
                fontWeight: 500,
              },
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.125rem',
              transition: 'font-size 0.15s ease',
            },
          }}
        >
        <BottomNavigationAction
          label="Группы"
          icon={<Groups />}
          value="groups"
        />
        <BottomNavigationAction
          label="Доска"
          icon={<Dashboard />}
          value="board"
        />
        <BottomNavigationAction
          label="Профиль"
          icon={<Person />}
          value="profile"
        />
        </MuiBottomNavigation>
      </Paper>
    </Box>
  );
};

