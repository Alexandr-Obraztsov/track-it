import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { authApi } from '../api/auth';
import { ROUTES } from '../constants/routes';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { webApp, isReady } = useTelegramWebApp();
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли уже токен
    const existingToken = localStorage.getItem('auth_token');
    if (existingToken) {
      // Если токен есть, перенаправляем на группы
      navigate(ROUTES.GROUPS);
      return;
    }

    if (!isReady || isAuthenticating) return;

    const authenticate = async () => {
      setIsAuthenticating(true);
      try {
        let initDataToUse: string;
        
        if (webApp?.initData) {
          // Используем initData из Telegram WebApp
          initDataToUse = webApp.initData;
        } else {
          // Для разработки вне Telegram - используем мок initData
          const mockUser = {
            id: 123456789,
            first_name: 'Иван',
            last_name: 'Петров',
            username: 'ivan_petrov',
          };
          initDataToUse = `user=${encodeURIComponent(JSON.stringify(mockUser))}&auth_date=${Math.floor(Date.now() / 1000)}`;
        }
        
        const response = await authApi.login(initDataToUse);
        if (response.token) {
          navigate(ROUTES.GROUPS);
        }
      } catch (err: any) {
        console.error('❌ Auth error:', err);
        
        // Более детальная обработка ошибок
        let errorMessage = 'Ошибка авторизации';
        let errorDetails = '';
        
        if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
          errorMessage = 'Ошибка сети';
          errorDetails = `Не удалось подключиться к серверу.\n\nПроверьте:\n- Подключение к интернету\n- Доступность сервера: ${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}\n- Настройки CORS на сервере\n\nОткройте Debug Panel (кнопка внизу справа) для детальных логов.`;
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
          errorDetails = err.response.data.details || '';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        console.error('Auth error details:', {
          message: errorMessage,
          details: errorDetails,
          error: err,
        });
        
        setError(errorMessage + (errorDetails ? `\n\n${errorDetails}` : ''));
        setIsAuthenticating(false);
      }
    };

    authenticate();
  }, [isReady, webApp]); // Убрали navigate из зависимостей

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
          p: 3,
        }}
      >
        <Typography color="error" variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
          {error.split('\n')[0]}
        </Typography>
        {error.includes('\n') && (
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{
              textAlign: 'center',
              whiteSpace: 'pre-line',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              maxWidth: '90%',
            }}
          >
            {error.split('\n').slice(1).join('\n')}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          Откройте Debug Panel (кнопка внизу справа) для детальных логов
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
};



