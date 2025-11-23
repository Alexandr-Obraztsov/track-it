import { useState, useEffect } from 'react';
import { Profile } from '../components/templates/Profile';
import type { User, NotificationSettings } from '../types/api';
import { authApi } from '../api/auth';
import { notificationsApi } from '../api/notifications';
import { mockNotificationSettings } from '../mocks/data';
import { isMockMode } from '../utils/mockMode';

export const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(mockNotificationSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authApi.getProfile();
        setUser({
          id: profile.id,
          telegramId: profile.telegramId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          photoUrl: profile.photoUrl,
          createdAt: new Date().toISOString(),
        });

        // Загружаем настройки уведомлений
        if (isMockMode()) {
          setNotificationSettings(mockNotificationSettings);
        } else {
          try {
            const settings = await notificationsApi.get();
            setNotificationSettings(settings);
          } catch (error) {
            console.error('Failed to load notification settings:', error);
            // Используем дефолтные настройки при ошибке
            setNotificationSettings(mockNotificationSettings);
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveNotifications = async (settings: NotificationSettings) => {
    try {
      if (isMockMode()) {
        // В режиме моков просто обновляем локальное состояние
        setNotificationSettings(settings);
      } else {
        // Сохраняем на бекенде
        const updatedSettings = await notificationsApi.update(settings);
        setNotificationSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      // Не пробрасываем ошибку, чтобы не блокировать UI
    }
  };

  if (!user) {
    return <div>Загрузка...</div>;
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



