import { baseApi } from './baseApi'
import type { Role, CreateRoleDto, UpdateRoleDto, ChatMember, Task, ApiResponse } from '@/types'

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Получить все роли
    getRoles: builder.query<Role[], { chatId?: string }>({
      query: (params) => ({
        url: '/roles',
        params,
      }),
      transformResponse: (response: ApiResponse<Role[]>) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Role' as const, id })),
              { type: 'Role', id: 'LIST' },
            ]
          : [{ type: 'Role', id: 'LIST' }],
    }),

    // Получить роль по ID
    getRoleById: builder.query<Role, number>({
      query: (id) => `/roles/${id}`,
      transformResponse: (response: ApiResponse<Role>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'Role', id }],
    }),

    // Создать роль
    createRole: builder.mutation<Role, CreateRoleDto>({
      query: (body) => ({
        url: '/roles',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Role>) => response.data!,
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    // Обновить роль
    updateRole: builder.mutation<Role, { id: number; data: UpdateRoleDto }>({
      query: ({ id, data }) => ({
        url: `/roles/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Role>) => response.data!,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Role', id }, { type: 'Role', id: 'LIST' }],
    }),

    // Удалить роль
    deleteRole: builder.mutation<void, number>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Role', id }, { type: 'Role', id: 'LIST' }],
    }),

    // Получить участников роли
    getRoleMembers: builder.query<ChatMember[], number>({
      query: (roleId) => `/roles/${roleId}/members`,
      transformResponse: (response: ApiResponse<ChatMember[]>) => response.data || [],
      providesTags: (_result, _error, roleId) => [
        { type: 'ChatMember', id: `ROLE_${roleId}` },
        { type: 'ChatMember', id: 'LIST' },
      ],
    }),

    // Назначить роль пользователю
    assignRole: builder.mutation<void, { roleId: number; userId: string }>({
      query: ({ roleId, userId }) => ({
        url: `/roles/${roleId}/assign`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (_result, _error, { roleId }) => [
        { type: 'ChatMember', id: `ROLE_${roleId}` },
        { type: 'ChatMember', id: 'LIST' },
      ],
    }),

    // Снять роль с пользователя
    removeRole: builder.mutation<void, { roleId: number; userId: string }>({
      query: ({ roleId, userId }) => ({
        url: `/roles/${roleId}/assign/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { roleId }) => [
        { type: 'ChatMember', id: `ROLE_${roleId}` },
        { type: 'ChatMember', id: 'LIST' },
      ],
    }),

    // Получить задачи роли
    getRoleTasks: builder.query<Task[], number>({
      query: (roleId) => `/roles/${roleId}/tasks`,
      transformResponse: (response: ApiResponse<Task[]>) => response.data || [],
      providesTags: (_result, _error, roleId) => [
        { type: 'Task', id: `ROLE_${roleId}` },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetRoleMembersQuery,
  useAssignRoleMutation,
  useRemoveRoleMutation,
  useGetRoleTasksQuery,
} = rolesApi

