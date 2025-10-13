import { baseApi } from './baseApi';
import { authApi } from './authApi';
import { usersApi } from './usersApi';
import { chatsApi } from './chatsApi';
import { tasksApi } from './tasksApi';
import { rolesApi } from './rolesApi';
import { geminiApi } from './geminiApi';

// Export all API slices
export {
  baseApi,
  authApi,
  usersApi,
  chatsApi,
  tasksApi,
  rolesApi,
  geminiApi,
};

// Export all hooks
export {
  useTelegramAuthMutation,
  useGetProfileQuery,
} from './authApi';

export {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from './usersApi';

export {
  useGetChatsQuery,
  useGetChatByIdQuery,
  useCreateChatMutation,
  useUpdateChatMutation,
  useDeleteChatMutation,
} from './chatsApi';

export {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetPersonalTasksQuery,
  useGetChatTasksQuery,
  useGetAssignedTasksQuery,
} from './tasksApi';

export {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from './rolesApi';

export {
  useExtractTasksMutation,
} from './geminiApi';

// Export API reducer and middleware for store configuration
export const apiReducer = baseApi.reducer;
export const apiMiddleware = baseApi.middleware;
