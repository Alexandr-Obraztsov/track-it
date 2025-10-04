// Типы задач
export type TaskType = 'personal' | 'group'

export interface Task {
  id: number
  title: string
  description?: string
  readableId: string
  localId: number
  deadline?: string
  isCompleted: boolean
  type: TaskType
  chatId?: string
  assignedUserId?: string
  assignedRoleId?: number
  createdAt: string
  updatedAt: string
  assignedUser?: User
  assignedRole?: Role
  chat?: Chat
}

export interface CreateTaskDto {
  title: string
  description?: string
  deadline?: string
  type: TaskType
  chatId?: string
  assignedUserId?: string
  assignedRoleId?: number
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  deadline?: string
  isCompleted?: boolean
  assignedUserId?: string
  assignedRoleId?: number
}

// Типы пользователей
export type NotificationPresetType = 'off' | 'minimal' | 'standard' | 'frequent' | 'maximum'

export interface User {
  telegramId: string
  username: string
  firstName: string
  lastName?: string
  createdAt: string
  updatedAt: string
  personalNotificationPreset: NotificationPresetType
  groupNotificationPreset: NotificationPresetType
  assignedTasks?: Task[]
  chatMemberships?: ChatMember[]
}

export interface CreateUserDto {
  telegramId: string
  username: string
  firstName: string
  lastName?: string
}

export interface UpdateUserDto {
  username?: string
  firstName?: string
  lastName?: string
  personalNotificationPreset?: NotificationPresetType
  groupNotificationPreset?: NotificationPresetType
}

// Типы чатов
export interface Chat {
  telegramId: string
  title: string
  username?: string
  welcomeMessageId?: number
  warningMessageId?: number
  createdAt: string
  updatedAt: string
  tasks?: Task[]
  members?: ChatMember[]
  roles?: Role[]
}

export interface CreateChatDto {
  telegramId: string
  title: string
  username?: string
}

export interface UpdateChatDto {
  title?: string
  username?: string
}

// Типы ролей
export interface Role {
  id: number
  name: string
  chatId: string
  createdAt: string
  updatedAt: string
  chat?: Chat
  members?: ChatMember[]
  assignedTasks?: Task[]
}

export interface CreateRoleDto {
  name: string
  chatId: string
}

export interface UpdateRoleDto {
  name?: string
}

// Типы участников чата
export interface ChatMember {
  id: number
  chatId: string
  userId: string
  roleId?: number
  joinedAt: string
  updatedAt: string
  chat?: Chat
  user?: User
  role?: Role
}

// API Response типы
export interface ApiResponse<T> {
  success: boolean
  data?: T
  count?: number
  message?: string
  error?: string
}
