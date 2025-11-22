import { useState, useEffect } from 'react';
import { Profile } from '../components/templates/Profile';
import type { User, NotificationSettings } from '../types/api';
import { authApi } from '../api/auth';
import { mockNotificationSettings } from '../mocks/data';

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
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveNotifications = async (settings: NotificationSettings) => {
    // TODO: Сохранить настройки уведомлений на бекенде
    setNotificationSettings(settings);
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



