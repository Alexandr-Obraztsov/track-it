import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { useRawInitData } from '@tma.js/sdk-react';
import { ROUTES } from '../constants/routes';

export const LoginPage = () => {
  const navigate = useNavigate();
  const rawInitData = useRawInitData();

  useEffect(() => {
    console.log('🔐 LoginPage: Component mounted');
    console.log('📋 LoginPage: rawInitData:', rawInitData ? 'present' : 'null');
    
    if (rawInitData === null) {
      console.warn('⚠️ LoginPage: rawInitData is null, waiting...');
      return;
    }
    
    console.log('💾 LoginPage: Saving initData to localStorage...');
    if (rawInitData) {
      localStorage.setItem('telegram_init_data', rawInitData);
      console.log('✅ LoginPage: initData saved to localStorage');
    } else {
      console.error('❌ LoginPage: rawInitData is undefined, cannot save');
      return;
    }
    
    // Проверяем, что данные сохранились
    const savedData = localStorage.getItem('telegram_init_data');
    console.log('✅ LoginPage: Verification - initData in localStorage:', savedData ? 'present' : 'missing');
    
    if (savedData) {
      // Пытаемся извлечь telegramId для логирования
      try {
        const params = new URLSearchParams(savedData);
        const userParam = params.get('user');
        if (userParam) {
          const userData = JSON.parse(decodeURIComponent(userParam));
          console.log('👤 LoginPage: User ID from initData:', userData?.id);
        }
      } catch (error) {
        console.warn('⚠️ LoginPage: Could not parse user data from initData');
      }
    }
    
    console.log('🚀 LoginPage: Navigating to groups page...');
    navigate(ROUTES.GROUPS);
  }, [rawInitData, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          Откройте Debug Panel (кнопка внизу справа) для детальных логов
        </Typography>
      </Box>
    );
};
