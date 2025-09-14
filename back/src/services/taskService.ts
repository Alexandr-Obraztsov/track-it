import { DataSource, Repository } from 'typeorm'
import { TaskEntity } from '../entities/Task'
import { ChatEntity } from '../entities/Chat'
import { MessageFormatterService } from './messageFormatterService'

// Сервис для управления задачами в базе данных
export class TaskService {
    private taskRepository: Repository<TaskEntity>
    private chatRepository: Repository<ChatEntity>

    constructor(dataSource: DataSource) {
        this.taskRepository = dataSource.getRepository(TaskEntity)
        this.chatRepository = dataSource.getRepository(ChatEntity)
    }

    // Создание новой личной задачи
    async createPersonalTask(taskData: {
        title: string
        description: string
        priority: 'high' | 'medium' | 'low'
        deadline: string | null
        userId: string
    }): Promise<TaskEntity> {
        const task = this.taskRepository.create({
            ...taskData,
            type: 'personal'
        })
        const savedTask = await this.taskRepository.save(task)
        
        // Генерируем читаемый ID для личных задач
        savedTask.readableId = `PSN-${savedTask.id}` // Personal task
        return await this.taskRepository.save(savedTask)
    }

    // Создание новой групповой задачи
    async createGroupTask(taskData: {
        title: string
        description: string
        priority: 'high' | 'medium' | 'low'
        deadline: string | null
        userId: string
        chatId: string
        assignedToUserId?: string
    }): Promise<TaskEntity> {
        const task = this.taskRepository.create({
            ...taskData,
            type: 'group'
        })
        const savedTask = await this.taskRepository.save(task)
        
        // Получаем название чата для генерации читаемого ID
        const chat = await this.chatRepository.findOne({ where: { chatId: taskData.chatId } })
        const chatTitle = chat?.title || 'Unknown'
        savedTask.readableId = MessageFormatterService.createTaskId(chatTitle, savedTask.id)
        
        return await this.taskRepository.save(savedTask)
    }

    // Получение всех личных задач пользователя
    async getPersonalTasks(userId: string): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: { userId, type: 'personal' },
            order: { createdAt: 'DESC' }
        })
    }

    // Получение всех групповых задач пользователя
    async getGroupTasks(userId: string): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: { userId, type: 'group' },
            order: { createdAt: 'DESC' }
        })
    }

    // Получение всех задач группы
    async getTasksByChat(chatId: string): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: { chatId, type: 'group' },
            relations: ['chat', 'assignedToRole'],
            order: { createdAt: 'DESC' }
        })
    }

    // Получение задач, назначенных конкретному участнику в группе
    async getTasksAssignedTo(chatId: string, assignedToUserId: string): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: { chatId, type: 'group', assignedToUserId },
            relations: ['chat', 'assignedToRole'],
            order: { createdAt: 'DESC' }
        })
    }

    // Получение задачи по ID для конкретного пользователя
    async getTaskById(id: number, userId: string): Promise<TaskEntity | null> {
        return await this.taskRepository.findOne({
            where: { id, userId }
        })
    }

    // Получение групповой задачи по ID (без проверки пользователя)
    async getGroupTaskById(id: number): Promise<TaskEntity | null> {
        return await this.taskRepository.findOne({
            where: { id, type: 'group' }
        })
    }

    // Получение задачи по читаемому ID
    async getTaskByReadableId(readableId: string): Promise<TaskEntity | null> {
        return await this.taskRepository.findOne({
            where: { readableId }
        })
    }

    // Обновление задачи
    async updateTask(id: number, userId: string, updateData: Partial<{
        title: string
        description: string
        priority: 'high' | 'medium' | 'low'
        deadline: string | null
        assignedToUserId?: string
        assignedToRoleId?: number
        isCompleted?: boolean
    }>): Promise<TaskEntity | null> {
        const task = await this.getTaskById(id, userId)
        if (!task) return null

        Object.assign(task, updateData)
        return await this.taskRepository.save(task)
    }

    // Обновление групповой задачи (без проверки пользователя)
    async updateGroupTask(id: number, updateData: Partial<{
        title: string
        description: string
        priority: 'high' | 'medium' | 'low'
        deadline: string | null
        assignedToUserId?: string
        assignedToRoleId?: number
        isCompleted?: boolean
    }>): Promise<TaskEntity | null> {
        const task = await this.getGroupTaskById(id)
        if (!task) return null

        Object.assign(task, updateData)
        return await this.taskRepository.save(task)
    }

    // Удаление задачи
    async deleteTask(id: number, userId: string): Promise<boolean> {
        const result = await this.taskRepository.delete({ id, userId })
        return (result.affected ?? 0) > 0
    }

    // Удаление групповой задачи (без проверки пользователя)
    async deleteGroupTask(id: number): Promise<boolean> {
        const result = await this.taskRepository.delete({ id, type: 'group' })
        return (result.affected ?? 0) > 0
    }

    // Создание задачи с возможностью назначения на роль
    async createTaskWithAssignment(taskData: {
        title: string
        description: string
        priority: 'high' | 'medium' | 'low'
        deadline?: Date
        userId: string
        chatId?: string
        assignedToUserId?: string
        assignedToRoleId?: number
    }): Promise<TaskEntity> {
        const task = this.taskRepository.create({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            deadline: taskData.deadline?.toISOString() || null,
            userId: taskData.userId,
            chatId: taskData.chatId,
            assignedToUserId: taskData.assignedToUserId,
            assignedToRoleId: taskData.assignedToRoleId,
            type: taskData.chatId ? 'group' : 'personal'
        })
        
        const savedTask = await this.taskRepository.save(task)
        
        // Генерируем читаемый ID
        if (taskData.chatId) {
            const chat = await this.chatRepository.findOne({ where: { chatId: taskData.chatId } })
            const chatTitle = chat?.title || 'Unknown'
            savedTask.readableId = MessageFormatterService.createTaskId(chatTitle, savedTask.id)
        } else {
            savedTask.readableId = `PSN-${savedTask.id}`
        }
        
        return await this.taskRepository.save(savedTask)
    }

    // Получение задач, назначенных на роль
    async getTasksByRole(chatId: string, roleId: number): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: { chatId, type: 'group', assignedToRoleId: roleId },
            relations: ['chat', 'assignedToRole'],
            order: { createdAt: 'DESC' }
        })
    }
}