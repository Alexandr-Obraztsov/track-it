import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TelegramLoginButton from 'react-telegram-login';
import { useAppDispatch } from './hooks/redux';
import { setAuth, setLoading } from './store/slices/authSlice';
import { useTelegramAuthMutation } from './store/api/authApi';
import type { TelegramUser } from './store/slices/authSlice';

// Тип для ошибки авторизации через Telegram
interface TelegramError {
  message: string;
  code?: string;
}

const TelegramLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [telegramAuth, { isLoading }] = useTelegramAuthMutation();
  const [error, setError] = useState<string | null>(null);

  const handleTelegramResponse = async (response: TelegramUser): Promise<void> => {
    try {
      setError(null);
      dispatch(setLoading(true));
      
      console.log('Данные пользователя:', response);
      
      // Отправляем данные на бэкенд для авторизации
      const authResult = await telegramAuth(response).unwrap();
      
      // Сохраняем данные пользователя и токен в Redux
      dispatch(setAuth({
        user: authResult.user,
        token: authResult.token
      }));
      
      // Перенаправляем на главную страницу
      navigate('/');
      
    } catch (err: any) {
      console.error('Ошибка авторизации:', err);
      setError(err?.data?.error || 'Ошибка авторизации');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleTelegramError = (error: TelegramError): void => {
    console.error('Ошибка авторизации:', error);
    setError(error.message);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Авторизация через Telegram
          </h2>
          <p className="text-gray-600 text-sm">
            Войдите в систему с помощью Telegram
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Авторизация...</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <TelegramLoginButton
              botName="track_it_tasks_bot"  // Замените на username вашего бота (без @)
              dataOnauth={handleTelegramResponse}
              dataOnError={handleTelegramError}
              size="large"  // Опции: small, medium, large
              requestAccess="write"  // Разрешение на запись (опционально)
              requestedFields="@username,@first_name,@last_name,@photo_url"  // Запрашиваемые поля
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramLogin;