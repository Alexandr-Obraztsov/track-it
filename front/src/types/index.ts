// Task types
export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignedUserId: number | null;
  assignedRoleId: number | null;
  deadline: string | null;
  status: 'backlog' | 'in_progress' | 'completed';
  createdAt: string;
  assignedUser?: {
    id: number;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
  } | null;
  assignedRole?: {
    id: number;
    title: string;
  } | null;
}

export interface User {
  id: number;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
}

export interface Chat {
  id: number;
  title: string;
  messageId: number;
  createdAt: string;
}

