import { apiClient } from './client';
import type { TaskComment } from '../types/api';

export interface CreateCommentData {
  taskId: number;
  content: string;
}

export interface UpdateCommentData {
  content: string;
}

export const commentsApi = {
  getByTaskId: async (taskId: number): Promise<TaskComment[]> => {
    const response = await apiClient.get(`/comments/task/${taskId}`);
    return response.data;
  },

  create: async (data: CreateCommentData): Promise<TaskComment> => {
    const response = await apiClient.post('/comments', data);
    return response.data;
  },

  update: async (commentId: number, data: UpdateCommentData): Promise<TaskComment> => {
    const response = await apiClient.put(`/comments/${commentId}`, data);
    return response.data;
  },

  delete: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};

