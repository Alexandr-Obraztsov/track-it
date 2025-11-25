import { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { theme } from './theme';
import { router } from './router';
import { miniApp } from '@tma.js/sdk-react';

function App() {
  useEffect(() => {
    miniApp.mount();
    // Устанавливаем цвета для Telegram Mini App
    if (miniApp) {
      miniApp.setHeaderColor(theme.palette.background.default);
      miniApp.setBgColor(theme.palette.background.default);
    }
  }, [miniApp]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
