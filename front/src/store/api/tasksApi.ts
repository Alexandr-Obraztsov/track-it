import { baseApi } from './baseApi'
import type { Task, CreateTaskDto, UpdateTaskDto, ApiResponse } from '@/types'

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Получить все задачи
    getTasks: builder.query<Task[], { chatId?: string; userId?: string; type?: string }>({
      query: (params) => ({
        url: '/tasks',
        params,
      }),
      transformResponse: (response: ApiResponse<Task[]>) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Task' as const, id })),
              { type: 'Task', id: 'LIST' },
            ]
          : [{ type: 'Task', id: 'LIST' }],
    }),

    // Получить задачу по ID
    getTaskById: builder.query<Task, number>({
      query: (id) => `/tasks/${id}`,
      transformResponse: (response: ApiResponse<Task>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),

    // Создать задачу
    createTask: builder.mutation<Task, CreateTaskDto>({
      query: (body) => ({
        url: '/tasks',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Task>) => response.data!,
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    // Обновить задачу
    updateTask: builder.mutation<Task, { id: number; data: UpdateTaskDto }>({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Task>) => response.data!,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Task', id }, { type: 'Task', id: 'LIST' }],
    }),

    // Удалить задачу
    deleteTask: builder.mutation<void, number>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Task', id }, { type: 'Task', id: 'LIST' }],
    }),

    // Отметить задачу как выполненную
    completeTask: builder.mutation<Task, number>({
      query: (id) => ({
        url: `/tasks/${id}/complete`,
        method: 'PATCH',
      }),
      transformResponse: (response: ApiResponse<Task>) => response.data!,
      invalidatesTags: (_result, _error, id) => [{ type: 'Task', id }, { type: 'Task', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCompleteTaskMutation,
} = tasksApi

