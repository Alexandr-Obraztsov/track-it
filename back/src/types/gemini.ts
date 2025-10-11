// Типы для Gemini сервиса

import { Chat } from "../entities/Chat";
import { User } from "../entities/User";
import { Task as TaskEntity } from "../entities/Task";

// Используем тип Task из сущностей для существующих задач
export type Task = TaskEntity;

export interface UpdatedTask {
  id: number;
  title?: string;
  description?: string;
  assignedUserId?: number;
  assignedRoleId?: number;
  deadline?: string;
}

export interface GeminiResult {
  newTasks: Task[];
  updatedTasks: UpdatedTask[];
}

export type TaskExtractionParams = {
  text?: string;
  audioData?: Buffer;
  audioMimeType?: string;
  existingTasks: Task[];
} & (
  { 
    isPersonal: false; 
    chat: Chat;
  } |
  { 
    isPersonal: true; 
    user: User;
  }
);