import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Базовый URL для API (можно вынести в env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      // Можно добавить токены авторизации здесь
      return headers
    },
  }),
  tagTypes: ['Task', 'User', 'Chat', 'Role', 'ChatMember'],
  endpoints: () => ({}),
})

