import { AppDataSource } from '../../configs/database';
import { Task } from '../../entities/Task';
import { User } from '../../entities/User';
import { Chat } from '../../entities/Chat';
import { UserTask } from '../../entities/UserTask';
import { Task as GeminiTask, UpdatedTask } from '../../types';
import { SaveTaskParams } from './types';
import { ChatTask } from '../../entities/ChatTask';


export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  private userTaskRepository = AppDataSource.getRepository(UserTask);
  private chatTaskRepository = AppDataSource.getRepository(ChatTask);
  /**
   * Сохраняет задачи из результата Gemini в базу данных
   */
  async saveTasks(
    params: SaveTaskParams
  ): Promise<Task[]> {
    const result : Task[] = [];

    try {
      result.push(...await this.createNewTasks(params));

      result.push(...await this.updateExistingTasks(params.geminiResult.updatedTasks));

      return result;
    } catch (error) {
      console.error('❌ [TASK_MANAGER] Error saving tasks:', error);
      throw error;
    }
  }

  private async createNewTasks(params: SaveTaskParams): Promise<Task[]> {
    const result : Task[] = [];

    for (const taskData of params.geminiResult.newTasks) {
      const task = this.taskRepository.create({
        title: taskData.title,
        description: taskData.description,
        assignedUserId: taskData.assignedUserId,
        assignedRoleId: taskData.assignedRoleId,
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,
      });
      const savedTask = await this.taskRepository.save(task);

      if (params.isPersonal) {
        const userTask = this.userTaskRepository.create({
          userId: params.user.id,
          taskId: savedTask.id
        });
        await this.userTaskRepository.save(userTask);
      } else {
        const chatTask = this.chatTaskRepository.create({
          chatId: params.chat.id,
          taskId: savedTask.id
        });
        await this.chatTaskRepository.save(chatTask);
      }

      result.push(savedTask);
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
          where: { id: updateData.id }
        });

        if (!existingTask) {
          console.warn('⚠️ [TASK_MANAGER] Task not found for update:', updateData.id);
          continue;
        }

        // Обновляем только переданные поля
        const updateFields: Partial<Task> = {
          ...updateData,
          deadline: updateData.deadline ? new Date(updateData.deadline) : undefined
        };

        await this.taskRepository.update(updateData.id, updateFields);

        // Получаем обновленную задачу
        const updatedTask = await this.taskRepository.findOne({
          where: { id: updateData.id }
        });

        if (updatedTask) {
          result.push(updatedTask);
        }

      } catch (error) {
        console.error('❌ [TASK_MANAGER] Error updating task:', error, updateData);
      }
    }

    return result;
  }


  /**
   * Получает личные задачи пользователя
   */
  async getUserPersonalTasks(userId: number): Promise<Task[]> {
    const userTaskRepository = AppDataSource.getRepository(UserTask);
    
    const userTasks = await userTaskRepository.find({
      where: { userId },
      relations: ['task']
    });

    return userTasks.map(ut => ut.task);
  }

  /**
   * Получает групповые задачи чата
   */
  async getChatTasks(chatId: number): Promise<Task[]> {
    const chatTaskRepository = AppDataSource.getRepository(ChatTask);
    const chatTasks = await chatTaskRepository.find({
      where: { chatId },
      relations: ['task']
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
