import React from 'react';
import { Box } from '@mui/material';
import { BottomNavigation, type NavigationTab } from '../../organisms/BottomNavigation';

export interface LayoutProps {
  children: React.ReactNode;
  currentTab?: NavigationTab;
  onTabChange?: (tab: NavigationTab) => void;
  showBottomNavigation?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  showBottomNavigation = true,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          pb: showBottomNavigation ? 8 : 0,
          // Скрываем скроллбар, но оставляем возможность прокрутки
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE и Edge
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome, Safari, Opera
          },
        }}
      >
        {children}
      </Box>

      {showBottomNavigation && currentTab && onTabChange && (
        <BottomNavigation value={currentTab} onChange={onTabChange} />
      )}
    </Box>
  );
};

