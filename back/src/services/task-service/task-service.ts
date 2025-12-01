import { AppDataSource } from '../../configs/database';
import { Task } from '../../entities/Task';
import { Chat } from '../../entities/Chat';
import { Label } from '../../entities/Label';
import { Task as GeminiTask, UpdatedTask } from '../../types';
import { SaveTaskParams } from './types';
import { ChatTask } from '../../entities/ChatTask';


export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  private chatTaskRepository = AppDataSource.getRepository(ChatTask);
  private labelRepository = AppDataSource.getRepository(Label);
  
  /**
   * Сохраняет задачи из результата Gemini в базу данных
   */
  async saveTasks(
    params: SaveTaskParams
  ): Promise<Task[]> {
    const result : Task[] = [];

    try {
      // Сначала создаем новые метки, если они есть
      const createdLabels = await this.createNewLabels(params);
      
      // Создаем новые задачи
      const newTasks = await this.createNewTasks(params, createdLabels);
      result.push(...newTasks);

      // Обновляем существующие задачи
      const updatedTasks = await this.updateExistingTasks(params.geminiResult.updatedTasks);
      result.push(...updatedTasks);


      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Создает новые метки из результата Gemini
   */
  private async createNewLabels(params: SaveTaskParams): Promise<Map<string, Label>> {
    const labelMap = new Map<string, Label>();
    
    if (!params.geminiResult.newLabels || params.geminiResult.newLabels.length === 0) {
      return labelMap;
    }

    for (const labelData of params.geminiResult.newLabels) {
      try {
        // Проверяем, не существует ли уже метка с таким именем
        const existingLabel = await this.labelRepository.findOne({
          where: { 
            chatId: params.chat.id,
            name: labelData.name.trim()
          }
        });

        if (existingLabel) {
          labelMap.set(labelData.name.trim().toLowerCase(), existingLabel);
          continue;
        }

        // Создаем новую метку
        const label = this.labelRepository.create({
          chatId: params.chat.id,
          name: labelData.name.trim(),
          color: labelData.color || null,
        });

        const savedLabel = await this.labelRepository.save(label);
        labelMap.set(labelData.name.trim().toLowerCase(), savedLabel);
      } catch (error) {
        // Продолжаем обработку остальных меток
      }
    }

    return labelMap;
  }

  private async createNewTasks(params: SaveTaskParams, createdLabels: Map<string, Label>): Promise<Task[]> {
    const result : Task[] = [];

    for (const taskData of params.geminiResult.newTasks) {
      try {
        // Определяем labelId для задачи
        let labelId: number | null = null;
        
        if (taskData.labelId) {
          // Используем существующую метку
          labelId = taskData.labelId;
        } else if (taskData.labelName) {
          // Ищем созданную метку по имени
          const label = createdLabels.get(taskData.labelName.trim().toLowerCase());
          if (label) {
            labelId = label.id;
          } else {
            // Пытаемся найти существующую метку в базе
            const existingLabel = await this.labelRepository.findOne({
              where: { 
                chatId: params.chat.id,
                name: taskData.labelName.trim()
              }
            });
            if (existingLabel) {
              labelId = existingLabel.id;
            }
          }
        }

        const task = this.taskRepository.create({
          title: taskData.title,
          description: taskData.description || null,
          assignedUserId: taskData.assignedUserId || null,
          assignedRoleId: taskData.assignedRoleId || null,
          deadline: taskData.deadline ? new Date(taskData.deadline) : null,
          labelId: labelId,
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
          relations: ['assignedUser', 'assignedRole', 'chat', 'label']
        });

        if (taskWithRelations) {
          result.push(taskWithRelations);
        } else {
          result.push(savedTask);
        }
      } catch (error) {
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
          relations: ['assignedUser', 'assignedRole', 'chat', 'label']
        });

        if (!existingTask) {
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
        if (updateData.labelId !== undefined) {
          existingTask.labelId = updateData.labelId;
        }

        const updatedTask = await this.taskRepository.save(existingTask);

        // Загружаем с relations
        const taskWithRelations = await this.taskRepository.findOne({
          where: { id: updatedTask.id },
          relations: ['assignedUser', 'assignedRole', 'chat', 'label']
        });

        if (taskWithRelations) {
          result.push(taskWithRelations);
        } else {
          result.push(updatedTask);
        }

      } catch (error) {
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
      relations: ['task', 'task.assignedUser', 'task.assignedRole', 'task.label']
    });
    return chatTasks.map(ct => ct.task);
  }


  /**
   * Получает задачу по ID
   */
  async getTaskById(taskId: number): Promise<Task | null> {
    return await this.taskRepository.findOne({ where: { id: taskId }, relations: ['assignedUser', 'assignedRole', 'chat', 'label'] });
  }

  /**
   * Удаляет задачу
   */
  async deleteTask(taskId: number): Promise<boolean> {
    try {
      const result = await this.taskRepository.delete(taskId);
      return result.affected !== undefined && result.affected !== null && result.affected > 0;
    } catch (error) {
      return false;
    }
  }
}

export const taskService = new TaskService();
export const taskManager = taskService;
