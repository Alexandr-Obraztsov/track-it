import { DataSource, Repository } from 'typeorm'
import { TaskEntity } from '../entities/Task'

// Сервис для управления задачами в базе данных
export class TaskService {
    private taskRepository: Repository<TaskEntity>

    constructor(dataSource: DataSource) {
        this.taskRepository = dataSource.getRepository(TaskEntity)
    }

    // Создание новой задачи
    async createTask(taskData: {
        title: string
        description: string
        priority: 'high' | 'medium' | 'low'
        deadline: string | null
        userId: number
    }): Promise<TaskEntity> {
        const task = this.taskRepository.create(taskData)
        return await this.taskRepository.save(task)
    }

    // Получение всех задач пользователя
    async getTasksByUser(userId: number): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        })
    }

    // Получение задачи по ID для конкретного пользователя
    async getTaskById(id: number, userId: number): Promise<TaskEntity | null> {
        return await this.taskRepository.findOne({
            where: { id, userId }
        })
    }

    // Обновление задачи
    async updateTask(id: number, userId: number, updateData: Partial<{
        title: string
        description: string
        priority: 'high' | 'medium' | 'low'
        deadline: string | null
    }>): Promise<TaskEntity | null> {
        const task = await this.getTaskById(id, userId)
        if (!task) return null

        Object.assign(task, updateData)
        return await this.taskRepository.save(task)
    }

    // Удаление задачи
    async deleteTask(id: number, userId: number): Promise<boolean> {
        const result = await this.taskRepository.delete({ id, userId })
        return (result.affected ?? 0) > 0
    }
}