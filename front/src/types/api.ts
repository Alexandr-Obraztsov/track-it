// Base types
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User extends BaseEntity {
  username: string;
  firstName: string;
  lastName: string | null;
  chats?: Chat[];
  roles?: Role[];
}

export interface CreateUserRequest {
  username: string;
  firstName: string;
  lastName?: string;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
}

// Chat types
export interface Chat extends BaseEntity {
  title: string;
  messageId: number;
  users?: User[];
  roles?: Role[];
}

export interface CreateChatRequest {
  title: string;
  messageId: number;
}

export interface UpdateChatRequest {
  title?: string;
  messageId?: number;
}

// Role types
export interface Role extends BaseEntity {
  title: string;
  users?: User[];
  chats?: Chat[];
}

export interface CreateRoleRequest {
  title: string;
}

export interface UpdateRoleRequest {
  title?: string;
}

// Task types
export interface Task extends BaseEntity {
  title: string;
  description: string | null;
  assignedUserId: number | null;
  assignedRoleId: number | null;
  deadline: string | null;
  assignedUser?: User;
  assignedRole?: Role;
  chat?: Chat;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  chatId?: number;
  assignedUserId?: number;
  assignedRoleId?: number;
  deadline?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  chatId?: number;
  assignedUserId?: number;
  assignedRoleId?: number;
  deadline?: string;
}

// Gemini types
export interface ExtractTasksRequest {
  text?: string;
  audioData?: Blob;
  type: 'personal' | 'group';
  userId?: number;
  chatId?: number;
}

export interface GeminiTask {
  title: string;
  description?: string;
  assignedUserId?: number;
  assignedRoleId?: number;
  deadline?: string;
}

export interface UpdatedTask {
  id: number;
  title?: string;
  description?: string;
  assignedUserId?: number;
  assignedRoleId?: number;
  deadline?: string;
}

export interface ExtractTasksResponse {
  newTasks: GeminiTask[];
  updatedTasks: UpdatedTask[];
  message: string;
}

// Auth types
export interface TelegramAuthRequest {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramAuthResponse {
  token: string;
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  };
}

export interface ProfileResponse {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

// API Response types
export interface ApiError {
  error: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
