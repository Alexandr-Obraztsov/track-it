import { baseApi } from './baseApi';
import type { 
  Chat, 
  CreateChatRequest, 
  UpdateChatRequest 
} from '../../types/api';

export const chatsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<Chat[], void>({
      query: () => '/chats',
      providesTags: ['Chat'],
    }),
    getChatById: builder.query<Chat, string>({
      query: (id) => `/chats/${id}`,
      providesTags: (_, __, id) => [{ type: 'Chat', id }],
    }),
    createChat: builder.mutation<Chat, CreateChatRequest>({
      query: (chatData) => ({
        url: '/chats',
        method: 'POST',
        body: chatData,
      }),
      invalidatesTags: ['Chat'],
    }),
    updateChat: builder.mutation<Chat, { id: string; data: UpdateChatRequest }>({
      query: ({ id, data }) => ({
        url: `/chats/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Chat', id }],
    }),
    deleteChat: builder.mutation<void, string>({
      query: (id) => ({
        url: `/chats/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
});

export const {
  useGetChatsQuery,
  useGetChatByIdQuery,
  useCreateChatMutation,
  useUpdateChatMutation,
  useDeleteChatMutation,
} = chatsApi;
