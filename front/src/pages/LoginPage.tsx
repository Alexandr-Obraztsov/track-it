import React, { useState } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { setUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import TelegramLoginButton from 'react-telegram-login';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, MessageCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTelegramResponse = async (response: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Данные пользователя:', response);
      
      // Сохраняем пользователя в Redux store
      dispatch(setUser(response));
      
      // Перенаправляем на главную страницу
      navigate('/');
    } catch (err) {
      setError('Произошла ошибка при авторизации');
      console.error('Ошибка авторизации:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramError = (error: any) => {
    setError('Ошибка авторизации через Telegram');
    console.error('Ошибка авторизации:', error);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Добро пожаловать в Track It</CardTitle>
          <CardDescription className="text-sm">
            Войдите через Telegram для доступа к системе управления задачами
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center">
            {isLoading ? (
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Авторизация...
              </Button>
            ) : (
              <div className="flex justify-center">
                <TelegramLoginButton
                  botName="track_it_tasks_bot"
                  dataOnauth={handleTelegramResponse}
                  dataOnError={handleTelegramError}
                  size="large"
                  requestAccess="write"
                  requestedFields="@username,@first_name,@last_name,@photo_url"
                />
              </div>
            )}
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>
              Нажимая кнопку входа, вы соглашаетесь с нашими{' '}
              <a href="#" className="text-blue-600 hover:underline">
                условиями использования
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
