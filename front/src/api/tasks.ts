import apiClient from './client';
import type { Task } from '../types/api';

export interface CreateTaskData {
  title: string;
  description?: string | null;
  assignedUserId?: number | null;
  assignedRoleId?: number | null;
  deadline?: string | null;
  status?: 'backlog' | 'in_progress' | 'completed';
  chatId: number;
  labelId?: number | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  assignedUserId?: number | null;
  assignedRoleId?: number | null;
  deadline?: string | null;
  status?: 'backlog' | 'in_progress' | 'completed';
  labelId?: number | null;
}

export const tasksApi = {
  getByChatId: async (chatId: number): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(`/tasks/chat/${chatId}`);
    return response.data;
  },

  getById: async (id: number): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskData): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  },

  update: async (id: number, data: UpdateTaskData): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: 'backlog' | 'in_progress' | 'completed'): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};

