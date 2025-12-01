import { AppDataSource } from '../configs/database';
import { Task } from '../entities/Task';
import { TaskHistory } from '../entities/TaskHistory';

type TaskHistoryField =
  | 'title'
  | 'description'
  | 'status'
  | 'assignedTelegramId'
  | 'assignedRoleId'
  | 'deadline'
  | 'labelId';

interface LogEntryInput {
  taskId: number;
  field: TaskHistoryField | 'task';
  oldValue: string | null;
  newValue: string | null;
  changeType: 'create' | 'update';
  changedByTelegramId: number | null;
}

export class TaskHistoryService {
  private repository = AppDataSource.getRepository(TaskHistory);

  private readonly trackedFields: TaskHistoryField[] = [
    'title',
    'description',
    'status',
    'assignedTelegramId',
    'assignedRoleId',
    'deadline',
    'labelId',
  ];

  private serializeFieldValue(task: Task, field: TaskHistoryField): string | null {
    switch (field) {
      case 'title':
      case 'description':
      case 'status':
        return task[field] ?? null;
      case 'assignedTelegramId':
      case 'assignedRoleId':
      case 'labelId':
        return task[field] !== null && task[field] !== undefined ? String(task[field]) : null;
      case 'deadline':
        return task.deadline ? new Date(task.deadline).toISOString() : null;
      default:
        return null;
    }
  }

  private async persist(entries: LogEntryInput[]): Promise<void> {
    if (!entries.length) return;
    const models = entries.map((entry) => this.repository.create(entry));
    await this.repository.save(models);
  }

  async logCreation(task: Task, changedByTelegramId: number | null): Promise<void> {
    const entries: LogEntryInput[] = [];

    for (const field of this.trackedFields) {
      const newValue = this.serializeFieldValue(task, field);
      if (newValue === null) {
        continue;
      }
      entries.push({
        taskId: task.id,
        field,
        oldValue: null,
        newValue,
        changeType: 'create',
        changedByTelegramId,
      });
    }

    if (!entries.length) {
      entries.push({
        taskId: task.id,
        field: 'task',
        oldValue: null,
        newValue: 'created',
        changeType: 'create',
        changedByTelegramId,
      });
    }

    await this.persist(entries);
  }

  async logUpdates(previous: Task, current: Task, changedByTelegramId: number | null): Promise<void> {
    const entries: LogEntryInput[] = [];

    for (const field of this.trackedFields) {
      const oldValue = this.serializeFieldValue(previous, field);
      const newValue = this.serializeFieldValue(current, field);
      if (oldValue === newValue) {
        continue;
      }
      entries.push({
        taskId: current.id,
        field,
        oldValue,
        newValue,
        changeType: 'update',
        changedByTelegramId,
      });
    }

    await this.persist(entries);
  }
}

export const taskHistoryService = new TaskHistoryService();

