import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { setUser, clearUser } from '../store/slices/authSlice';
import { useGetProfileQuery } from '../store/api/authApi';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  // Загружаем профиль пользователя, если есть токен, но нет данных пользователя
  const { data: profile, error, isLoading } = useGetProfileQuery(undefined, {
    skip: !token || !!user,
  });

  useEffect(() => {
    if (profile && !user) {
      // Преобразуем ProfileResponse в TelegramUser
      const telegramUser = {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        photo_url: profile.photo_url,
        auth_date: Date.now() / 1000,
        hash: '',
      };
      dispatch(setUser(telegramUser));
    }
  }, [profile, user, dispatch]);

  useEffect(() => {
    if (error && 'status' in error && (error.status === 401 || error.status === 403)) {
      dispatch(clearUser());
    }
  }, [error, dispatch]);

  return {
    isAuthenticated: isAuthenticated && !!token,
    user,
    token,
    isLoading,
    error,
  };
};
