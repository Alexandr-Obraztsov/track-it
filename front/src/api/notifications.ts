import apiClient from './client';
import type { NotificationSettings } from '../types/api';

export const notificationsApi = {
  get: async (): Promise<NotificationSettings> => {
    const response = await apiClient.get<NotificationSettings>('/notifications');
    return response.data;
  },

  update: async (settings: NotificationSettings): Promise<NotificationSettings> => {
    const response = await apiClient.put<NotificationSettings>('/notifications', settings);
    return response.data;
  },
};

