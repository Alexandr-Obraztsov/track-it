import { useState } from 'react';
import TelegramLoginButton from 'react-telegram-login';
import { useAppDispatch } from '../hooks/redux';
import { setAuth, setLoading } from '../store/slices/authSlice';
import { useTelegramAuthMutation } from '../store/api/authApi';
import type { TelegramUser } from '../store/slices/authSlice';
import type { TelegramError } from 'react-telegram-login';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const [telegramAuth, { isLoading }] = useTelegramAuthMutation();
  const [error, setError] = useState<string | null>(null);

  const handleTelegramResponse = async (response: TelegramUser): Promise<void> => {
    try {
      setError(null);
      dispatch(setLoading(true));
      
      console.log('Данные пользователя:', response);
      
      const authResult = await telegramAuth(response).unwrap();
      
      dispatch(setAuth({
        user: authResult.user,
        token: authResult.token
      }));
      
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
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="space-y-6 text-center">
          {/* Заголовок */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight text-foreground">
              Track It
            </h1>
            <p className="text-lg text-muted-foreground">
              Управление задачами и командой
            </p>
          </div>

          {/* Авторизация */}
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertDescription className="text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-base">Загрузка...</span>
                </div>
              ) : (
                <TelegramLoginButton
                  botName="track_it_tasks_bot"
                  dataOnauth={handleTelegramResponse}
                  dataOnError={handleTelegramError}
                  size="large"
                  requestAccess="write"
                  requestedFields="@username,@first_name,@last_name,@photo_url"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

