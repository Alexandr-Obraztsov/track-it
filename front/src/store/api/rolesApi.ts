import { baseApi } from './baseApi';
import type { 
  Role, 
  CreateRoleRequest, 
  UpdateRoleRequest 
} from '../../types/api';

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<Role[], void>({
      query: () => '/roles',
      providesTags: ['Role'],
    }),
    getRoleById: builder.query<Role, string>({
      query: (id) => `/roles/${id}`,
      providesTags: (_, __, id) => [{ type: 'Role', id }],
    }),
    createRole: builder.mutation<Role, CreateRoleRequest>({
      query: (roleData) => ({
        url: '/roles',
        method: 'POST',
        body: roleData,
      }),
      invalidatesTags: ['Role'],
    }),
    updateRole: builder.mutation<Role, { id: string; data: UpdateRoleRequest }>({
      query: ({ id, data }) => ({
        url: `/roles/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Role', id }],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rolesApi;
