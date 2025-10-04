import { baseApi } from './baseApi'
import type { User, CreateUserDto, UpdateUserDto, Task, Chat, ApiResponse } from '@/types'

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Получить всех пользователей
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      transformResponse: (response: ApiResponse<User[]>) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ telegramId }) => ({ type: 'User' as const, id: telegramId })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // Получить пользователя по ID
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      transformResponse: (response: ApiResponse<User>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    // Создать пользователя
    createUser: builder.mutation<User, CreateUserDto>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<User>) => response.data!,
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // Обновить пользователя
    updateUser: builder.mutation<User, { id: string; data: UpdateUserDto }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<User>) => response.data!,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    // Удалить пользователя
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    // Получить задачи пользователя
    getUserTasks: builder.query<Task[], { userId: string; chatId?: string }>({
      query: ({ userId, chatId }) => ({
        url: `/users/${userId}/tasks`,
        params: { chatId },
      }),
      transformResponse: (response: ApiResponse<Task[]>) => response.data || [],
      providesTags: (_result, _error, { userId }) => [
        { type: 'Task', id: `USER_${userId}` },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    // Получить чаты пользователя
    getUserChats: builder.query<Chat[], string>({
      query: (userId) => `/users/${userId}/chats`,
      transformResponse: (response: ApiResponse<Chat[]>) => response.data || [],
      providesTags: (_result, _error, userId) => [
        { type: 'Chat', id: `USER_${userId}` },
        { type: 'Chat', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUserTasksQuery,
  useGetUserChatsQuery,
} = usersApi

