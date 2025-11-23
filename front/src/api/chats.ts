import apiClient from './client';
import type { Chat } from '../types/api';

export const chatsApi = {
  getAll: async (): Promise<Chat[]> => {
    const response = await apiClient.get<Chat[]>('/chats');
    return response.data;
  },

  getById: async (id: number): Promise<Chat> => {
    const response = await apiClient.get<Chat>(`/chats/${id}`);
    return response.data;
  },

  create: async (data: { title: string; messageId: number }): Promise<Chat> => {
    const response = await apiClient.post<Chat>('/chats', data);
    return response.data;
  },

  update: async (id: number, data: { title?: string; messageId?: number }): Promise<Chat> => {
    const response = await apiClient.put<Chat>(`/chats/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/chats/${id}`);
  },
};

