import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Базовый URL для API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      // Здесь можно добавить токены авторизации
      // const token = (getState() as RootState).auth.token;
      // if (token) {
      //   headers.set('authorization', `Bearer ${token}`);
      // }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Chat', 'Task', 'Role'],
  endpoints: (builder) => ({
    // Auth endpoints
    loginUser: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/auth/login',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // User endpoints
    getUsers: builder.query<any[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),

    getUserById: builder.query<any, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_, __, id) => [{ type: 'User', id }],
    }),

    // Chat endpoints
    getChats: builder.query<any[], void>({
      query: () => '/chats',
      providesTags: ['Chat'],
    }),

    getChatById: builder.query<any, string>({
      query: (id) => `/chats/${id}`,
      providesTags: (_, __, id) => [{ type: 'Chat', id }],
    }),

    // Task endpoints
    getTasks: builder.query<any[], void>({
      query: () => '/tasks',
      providesTags: ['Task'],
    }),

    getTaskById: builder.query<any, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_, __, id) => [{ type: 'Task', id }],
    }),

    createTask: builder.mutation<any, any>({
      query: (taskData) => ({
        url: '/tasks',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: ['Task'],
    }),

    updateTask: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Task', id }],
    }),

    deleteTask: builder.mutation<any, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),

    // Role endpoints
    getRoles: builder.query<any[], void>({
      query: () => '/roles',
      providesTags: ['Role'],
    }),

    // Gemini endpoints
    sendMessage: builder.mutation<any, any>({
      query: (messageData) => ({
        url: '/gemini/message',
        method: 'POST',
        body: messageData,
      }),
    }),
  }),
});

export const {
  useLoginUserMutation,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetChatsQuery,
  useGetChatByIdQuery,
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetRolesQuery,
  useSendMessageMutation,
} = api;
