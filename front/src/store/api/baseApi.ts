import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Кастомный baseQuery для правильной обработки ошибок
const baseQueryWithErrorHandling = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    headers.set('Content-Type', 'application/json');
    
    // Добавляем JWT токен к заголовкам, если он есть
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQueryWithErrorHandling(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    localStorage.removeItem('auth_token');
  }
  
  return result;
};

// Базовый API с общими настройками
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Chat', 'Task', 'Role', 'Auth', 'Gemini'],
  endpoints: () => ({}),
});

// Общие типы для API ответов
export interface ApiResponse<T> {
  data: T;
  message?: string;
}


// Общие мутации и запросы
// Здесь будут общие хуки, если понадобятся
