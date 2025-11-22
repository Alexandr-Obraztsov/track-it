import apiClient from './client';

export interface AuthResponse {
  user: {
    id: number;
    telegramId: number;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
    photoUrl?: string | null;
  };
  token: string;
}

export const authApi = {
  login: async (initData: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/telegram', { initData });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },
};

