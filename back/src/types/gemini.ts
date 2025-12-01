// Типы для Gemini сервиса

import { Chat } from "../entities/Chat";
import { User } from "../entities/User";
import { Task as TaskEntity } from "../entities/Task";
import { Label } from "../entities/Label";

// Используем тип Task из сущностей для существующих задач
export type Task = TaskEntity;

export interface UpdatedTask {
  id: number;
  title?: string;
  description?: string;
  assignedUserId?: number;
  assignedRoleId?: number;
  deadline?: string;
  labelId?: number | null;
}

export interface NewLabel {
  name: string;
  color?: string | null;
}

export interface GeminiResult {
  newTasks: Array<{
    title: string;
    description?: string | null;
    assignedUserId?: number | null;
    assignedRoleId?: number | null;
    deadline?: string | null;
    labelId?: number | null;
    labelName?: string | null; // Для создания новой метки
  }>;
  updatedTasks: UpdatedTask[];
  newLabels?: NewLabel[]; // Новые метки для создания
}

export type TaskExtractionParams = {
  text?: string;
  audioData?: Buffer;
  audioMimeType?: string;
  existingTasks: Task[];
  chat: Chat;
  labels?: Label[];
};