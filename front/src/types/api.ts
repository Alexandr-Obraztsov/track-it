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

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignedUserId: number | null;
  assignedRoleId: number | null;
  deadline: string | null;
  status: 'backlog' | 'in_progress' | 'completed';
  createdAt: string;
  assignedUser?: User | null;
  assignedRole?: Role | null;
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
  taskAssigned: boolean;
  taskCompleted: boolean;
  taskDeadline: boolean;
  taskComment: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}

