import apiClient from './client';
import type { Label } from '../types/api';

export interface CreateLabelData {
  chatId: number;
  name: string;
  color?: string | null;
}

export interface UpdateLabelData {
  name?: string;
  color?: string | null;
}

export const labelsApi = {
  getByChatId: async (chatId: number): Promise<Label[]> => {
    const response = await apiClient.get<Label[]>(`/labels/chat/${chatId}`);
    return response.data;
  },

  getById: async (id: number): Promise<Label> => {
    const response = await apiClient.get<Label>(`/labels/${id}`);
    return response.data;
  },

  create: async (data: CreateLabelData): Promise<Label> => {
    const response = await apiClient.post<Label>('/labels', data);
    return response.data;
  },

  update: async (id: number, data: UpdateLabelData): Promise<Label> => {
    const response = await apiClient.put<Label>(`/labels/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/labels/${id}`);
  },
};

