import { useState, useEffect } from 'react';
import { Profile } from '../components/templates/Profile';
import type { User, NotificationSettings } from '../types/api';
import { authApi } from '../api/auth';
import { notificationsApi } from '../api/notifications';

export const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      console.log('🔄 ProfilePage: Starting to load profile...');
      console.log('📋 ProfilePage: Checking localStorage for initData...');
      const initData = localStorage.getItem('telegram_init_data');
      console.log('📋 ProfilePage: initData in localStorage:', initData ? 'present' : 'missing');
      
      try {
        console.log('📤 ProfilePage: Calling authApi.getProfile()...');
        const profile = await authApi.getProfile();
        console.log('✅ ProfilePage: Profile loaded successfully:', {
          telegramId: profile.telegramId,
          firstName: profile.firstName,
          username: profile.username,
        });
        
        setUser({
          id: profile.id || profile.telegramId, // Fallback на telegramId если id нет
          telegramId: profile.telegramId,
          firstName: profile.firstName,
          lastName: profile.lastName ?? null,
          username: profile.username ?? null,
          photoUrl: profile.photoUrl ?? null,
          createdAt: profile.createdAt || new Date().toISOString(),
        });

        // Загружаем настройки уведомлений
        try {
          console.log('📤 ProfilePage: Loading notification settings...');
          const settings = await notificationsApi.get();
          console.log('✅ ProfilePage: Notification settings loaded');
          setNotificationSettings(settings);
        } catch (error) {
          console.error('❌ ProfilePage: Failed to load notification settings:', error);
          // При ошибке оставляем null, компонент Profile обработает это
        }
      } catch (error: any) {
        console.error('❌ ProfilePage: Failed to load profile:', error);
        console.error('❌ ProfilePage: Error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            method: error.config?.method,
          },
        });
        
        // Если ошибка 401, удаляем initData и редиректим на логин
        if (error.response?.status === 401) {
          console.warn('⚠️ ProfilePage: 401 Unauthorized, redirecting to login...');
          localStorage.removeItem('telegram_init_data');
          window.location.href = '/';
        }
      } finally {
        setLoading(false);
        console.log('🏁 ProfilePage: Loading finished');
      }
    };

    loadProfile();
  }, []);

  const handleSaveNotifications = async (settings: NotificationSettings) => {
    try {
      // Сохраняем на бекенде
      const updatedSettings = await notificationsApi.update(settings);
      setNotificationSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      // Не пробрасываем ошибку, чтобы не блокировать UI
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <div>Ошибка загрузки профиля</div>;
  }

  return (
    <Profile
      user={user}
      notificationSettings={notificationSettings}
      onSaveNotifications={handleSaveNotifications}
      loading={loading}
    />
  );
};



