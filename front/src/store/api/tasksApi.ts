import { baseApi } from './baseApi';
import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest 
} from '../../types/api';

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => '/tasks',
      providesTags: ['Task'],
    }),
    getTaskById: builder.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_, __, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation<Task, CreateTaskRequest>({
      query: (taskData) => ({
        url: '/tasks',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation<Task, { id: string; data: UpdateTaskRequest }>({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Task', id }],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
    getPersonalTasks: builder.query<Task[], string>({
      query: (userId) => `/tasks/personal/${userId}`,
      providesTags: ['Task'],
    }),
    getChatTasks: builder.query<Task[], string>({
      query: (chatId) => `/tasks/chat/${chatId}`,
      providesTags: ['Task'],
    }),
    getAssignedTasks: builder.query<Task[], string>({
      query: (userId) => `/tasks/assigned/${userId}`,
      providesTags: ['Task'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetPersonalTasksQuery,
  useGetChatTasksQuery,
  useGetAssignedTasksQuery,
} = tasksApi;
