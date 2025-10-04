import { baseApi } from './baseApi'
import type { Chat, CreateChatDto, UpdateChatDto, ChatMember, Task, ApiResponse } from '@/types'

export const chatsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Получить все чаты
    getChats: builder.query<Chat[], void>({
      query: () => '/chats',
      transformResponse: (response: ApiResponse<Chat[]>) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ telegramId }) => ({ type: 'Chat' as const, id: telegramId })),
              { type: 'Chat', id: 'LIST' },
            ]
          : [{ type: 'Chat', id: 'LIST' }],
    }),

    // Получить чат по ID
    getChatById: builder.query<Chat, string>({
      query: (id) => `/chats/${id}`,
      transformResponse: (response: ApiResponse<Chat>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'Chat', id }],
    }),

    // Создать чат
    createChat: builder.mutation<Chat, CreateChatDto>({
      query: (body) => ({
        url: '/chats',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Chat>) => response.data!,
      invalidatesTags: [{ type: 'Chat', id: 'LIST' }],
    }),

    // Обновить чат
    updateChat: builder.mutation<Chat, { id: string; data: UpdateChatDto }>({
      query: ({ id, data }) => ({
        url: `/chats/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Chat>) => response.data!,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Chat', id }, { type: 'Chat', id: 'LIST' }],
    }),

    // Удалить чат
    deleteChat: builder.mutation<void, string>({
      query: (id) => ({
        url: `/chats/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Chat', id }, { type: 'Chat', id: 'LIST' }],
    }),

    // Получить участников чата
    getChatMembers: builder.query<ChatMember[], string>({
      query: (chatId) => `/chats/${chatId}/members`,
      transformResponse: (response: ApiResponse<ChatMember[]>) => response.data || [],
      providesTags: (_result, _error, chatId) => [
        { type: 'ChatMember', id: `CHAT_${chatId}` },
        { type: 'ChatMember', id: 'LIST' },
      ],
    }),

    // Добавить участника в чат
    addChatMember: builder.mutation<void, { chatId: string; userId: string }>({
      query: ({ chatId, userId }) => ({
        url: `/chats/${chatId}/members`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: 'ChatMember', id: `CHAT_${chatId}` },
        { type: 'ChatMember', id: 'LIST' },
      ],
    }),

    // Удалить участника из чата
    removeChatMember: builder.mutation<void, { chatId: string; userId: string }>({
      query: ({ chatId, userId }) => ({
        url: `/chats/${chatId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: 'ChatMember', id: `CHAT_${chatId}` },
        { type: 'ChatMember', id: 'LIST' },
      ],
    }),

    // Получить задачи чата
    getChatTasks: builder.query<Task[], string>({
      query: (chatId) => `/chats/${chatId}/tasks`,
      transformResponse: (response: ApiResponse<Task[]>) => response.data || [],
      providesTags: (_result, _error, chatId) => [
        { type: 'Task', id: `CHAT_${chatId}` },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetChatsQuery,
  useGetChatByIdQuery,
  useCreateChatMutation,
  useUpdateChatMutation,
  useDeleteChatMutation,
  useGetChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useGetChatTasksQuery,
} = chatsApi

