import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Кастомный baseQuery для правильной обработки ошибок
const baseQueryWithErrorHandling = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  prepareHeaders: (headers, { getState }: any) => {
    // Добавляем JWT токен к заголовкам, если он есть
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    // Content-Type будет установлен автоматически:
    // - для JSON: application/json
    // - для FormData: multipart/form-data с boundary
    
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQueryWithErrorHandling(args, api, extraOptions);
  
  // Обработка ошибок парсинга JSON
  if (result.error && result.error.status === 'PARSING_ERROR') {
    console.error('JSON parsing error:', result.error);
    // Преобразуем ошибку парсинга в понятный формат
    result.error = {
      status: result.error.originalStatus || 500,
      data: {
        error: result.error.data || 'Ошибка сервера',
        message: 'Сервер вернул некорректный ответ'
      }
    };
  }
  
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
