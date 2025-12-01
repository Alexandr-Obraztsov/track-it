import apiClient from './client';

export interface UserProfile {
  id?: number; // Добавляем id, так как бэкенд его возвращает
  telegramId: number;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
  createdAt?: string;
}

export const authApi = {
  getProfile: async (): Promise<UserProfile> => {
    console.log('📤 authApi.getProfile: Making request to /auth/profile');
    try {
      const response = await apiClient.get<UserProfile>('/auth/profile');
      console.log('✅ authApi.getProfile: Response received:', {
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (error) {
      console.error('❌ authApi.getProfile: Request failed:', error);
      throw error;
    }
  },

  logout: () => {
    console.log('🚪 authApi.logout: Clearing initData from localStorage');
    localStorage.removeItem('telegram_init_data');
  },
};

