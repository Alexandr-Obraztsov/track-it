import { AppDataSource } from '../../configs/database';
import { Task } from '../../entities/Task';
import { Chat } from '../../entities/Chat';
import { Task as GeminiTask, UpdatedTask } from '../../types';
import { SaveTaskParams } from './types';
import { ChatTask } from '../../entities/ChatTask';


export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  private chatTaskRepository = AppDataSource.getRepository(ChatTask);
  /**
   * Сохраняет задачи из результата Gemini в базу данных
   */
  async saveTasks(
    params: SaveTaskParams
  ): Promise<Task[]> {
    const result : Task[] = [];

    try {
      // Создаем новые задачи
      const newTasks = await this.createNewTasks(params);
      result.push(...newTasks);

      // Обновляем существующие задачи
      const updatedTasks = await this.updateExistingTasks(params.geminiResult.updatedTasks);
      result.push(...updatedTasks);

      console.log('✅ [TASK_SERVICE] Tasks saved:', {
        newTasks: newTasks.length,
        updatedTasks: updatedTasks.length,
        chatId: params.chat.id
      });

      return result;
    } catch (error) {
      console.error('❌ [TASK_SERVICE] Error saving tasks:', error);
      throw error;
    }
  }

  private async createNewTasks(params: SaveTaskParams): Promise<Task[]> {
    const result : Task[] = [];

    for (const taskData of params.geminiResult.newTasks) {
      try {
        const task = this.taskRepository.create({
          title: taskData.title,
          description: taskData.description || null,
          assignedUserId: taskData.assignedUserId || null,
          assignedRoleId: taskData.assignedRoleId || null,
          deadline: taskData.deadline ? new Date(taskData.deadline) : null,
          status: 'backlog', // Все новые задачи создаются со статусом backlog
          chat: params.chat,
        });
        const savedTask = await this.taskRepository.save(task);

        // Создаем связь через ChatTask
        const chatTask = this.chatTaskRepository.create({
          chatId: params.chat.id,
          taskId: savedTask.id
        });
        await this.chatTaskRepository.save(chatTask);

        // Загружаем задачу с relations для возврата
        const taskWithRelations = await this.taskRepository.findOne({
          where: { id: savedTask.id },
          relations: ['assignedUser', 'assignedRole', 'chat']
        });

        if (taskWithRelations) {
          result.push(taskWithRelations);
        } else {
          result.push(savedTask);
        }
      } catch (error) {
        console.error('❌ [TASK_SERVICE] Error creating task:', error, taskData);
        // Продолжаем обработку остальных задач
      }
    }

    return result;
  }

  /**
   * Обновляет существующие задачи
   */
  private async updateExistingTasks(
    updatedTasks: UpdatedTask[]
  ): Promise<Task[]> {
    const result : Task[] = [];

    for (const updateData of updatedTasks) {
      try {
        const existingTask = await this.taskRepository.findOne({
          where: { id: updateData.id },
          relations: ['assignedUser', 'assignedRole', 'chat']
        });

        if (!existingTask) {
          console.warn('⚠️ [TASK_SERVICE] Task not found for update:', updateData.id);
          continue;
        }

        // Обновляем только переданные поля
        if (updateData.title !== undefined) {
          existingTask.title = updateData.title;
        }
        if (updateData.description !== undefined) {
          existingTask.description = updateData.description || null;
        }
        if (updateData.assignedUserId !== undefined) {
          existingTask.assignedUserId = updateData.assignedUserId || null;
        }
        if (updateData.assignedRoleId !== undefined) {
          existingTask.assignedRoleId = updateData.assignedRoleId || null;
        }
        if (updateData.deadline !== undefined) {
          existingTask.deadline = updateData.deadline ? new Date(updateData.deadline) : null;
        }
        if (updateData.status !== undefined) {
          existingTask.status = updateData.status;
        }

        const updatedTask = await this.taskRepository.save(existingTask);

        // Загружаем с relations
        const taskWithRelations = await this.taskRepository.findOne({
          where: { id: updatedTask.id },
          relations: ['assignedUser', 'assignedRole', 'chat']
        });

        if (taskWithRelations) {
          result.push(taskWithRelations);
        } else {
          result.push(updatedTask);
        }

      } catch (error) {
        console.error('❌ [TASK_SERVICE] Error updating task:', error, updateData);
        // Продолжаем обработку остальных задач
      }
    }

    return result;
  }


  /**
   * Получает задачи чата
   */
  async getChatTasks(chatId: number): Promise<Task[]> {
    const chatTaskRepository = AppDataSource.getRepository(ChatTask);
    const chatTasks = await chatTaskRepository.find({
      where: { chatId },
      relations: ['task', 'task.assignedUser', 'task.assignedRole']
    });
    return chatTasks.map(ct => ct.task);
  }


  /**
   * Получает задачу по ID
   */
  async getTaskById(taskId: number): Promise<Task | null> {
    return await this.taskRepository.findOne({ where: { id: taskId }, relations: ['assignedUser', 'assignedRole', 'chat'] });
  }

  /**
   * Удаляет задачу
   */
  async deleteTask(taskId: number): Promise<boolean> {
    try {
      const result = await this.taskRepository.delete(taskId);
      return result.affected !== undefined && result.affected !== null && result.affected > 0;
    } catch (error) {
      console.error('❌ [TASK_MANAGER] Error deleting task:', error);
      return false;
    }
  }
}

export const taskService = new TaskService();
export const taskManager = taskService;
