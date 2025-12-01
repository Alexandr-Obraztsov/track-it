// API Types based on backend structure

export interface User {
  id: number;
  telegramId: number | null;
  username: string | null;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export interface Role {
  id: number;
  title: string;
  createdAt: string;
}

export interface Label {
  id: number;
  chatId: number;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignedUserId: number | null;
  assignedRoleId: number | null;
  deadline: string | null;
  status: 'backlog' | 'in_progress' | 'completed';
  createdAt: string;
  labelId: number | null;
  assignedUser?: User | null;
  assignedRole?: Role | null;
  label?: Label | null;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  edited: boolean;
  editedAt: string | null;
  createdAt: string;
  user?: User;
}

export interface UserChatRole {
  id: number;
  userId: number;
  chatId: number;
  roleId: number;
  createdAt: string;
  user?: User;
  role?: Role;
}

export interface ChatRole {
  id: number;
  chatId: number;
  roleId: number;
  createdAt: string;
  role?: Role;
}

export interface Chat {
  id: number;
  title: string;
  messageId: number;
  createdAt: string;
  userChatRoles?: UserChatRole[];
  chatRoles?: ChatRole[];
  tasks?: Task[];
}

export interface NotificationSettings {
  dailyDigestTime: string; // Время ежедневного получения списка задач (формат "HH:mm", например "09:00")
  deadlineReminderHours: number[]; // Массив значений: за сколько часов до дедлайна показывать уведомления
}

