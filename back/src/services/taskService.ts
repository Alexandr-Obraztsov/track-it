import { DataSource, Repository } from 'typeorm'
import { TaskEntity } from '../entities/Task'
import { ChatEntity } from '../entities/Chat'
import { UserEntity } from '../entities/User'
import { RoleEntity } from '../entities/Role'
import { MessageFormatterService } from './messageFormatterService'

// Интерфейс для создания задачи
export interface CreateTaskDto {
    title: string
    description: string
    priority?: 'high' | 'medium' | 'low'
    deadline?: Date
    authorId: string // ID автора
    type?: 'personal' | 'group'
    chatId?: string // Для групповых задач
    assignedUserId?: string // Назначение пользователю
    assignedRoleId?: number // Назначение роли
}

// Интерфейс для обновления задачи
export interface UpdateTaskDto {
    title?: string
    description?: string
    priority?: 'high' | 'medium' | 'low'
    deadline?: Date | null
    assignedUserId?: string | null
    assignedRoleId?: number | null
    isCompleted?: boolean
}

// Объединенный сервис для всех типов задач
export class TaskService {
    private taskRepository: Repository<TaskEntity>
    private chatRepository: Repository<ChatEntity>
    private userRepository: Repository<UserEntity>
    private roleRepository: Repository<RoleEntity>

    constructor(dataSource: DataSource) {
        this.taskRepository = dataSource.getRepository(TaskEntity)
        this.chatRepository = dataSource.getRepository(ChatEntity)
        this.userRepository = dataSource.getRepository(UserEntity)
        this.roleRepository = dataSource.getRepository(RoleEntity)
    }

    // Создание задачи (личной или групповой)
    async createTask(data: CreateTaskDto): Promise<TaskEntity> {
        // Определяем тип задачи
        const type = data.chatId ? 'group' : 'personal'
        
        // Проверяем существование автора
        const author = await this.userRepository.findOne({
            where: { telegramId: data.authorId }
        })
        if (!author) {
            throw new Error('Автор задачи не найден')
        }

        // Для групповых задач проверяем существование чата
        if (type === 'group' && data.chatId) {
            const chat = await this.chatRepository.findOne({
                where: { telegramId: data.chatId }
            })
            if (!chat) {
                throw new Error('Чат не найден')
            }
        }

        // Создаем задачу
        const task = this.taskRepository.create({
            title: data.title,
            description: data.description,
            priority: data.priority || 'medium',
            deadline: data.deadline,
            authorId: data.authorId,
            type,
            chatId: data.chatId,
            assignedUserId: data.assignedUserId,
            assignedRoleId: data.assignedRoleId
        })

        const savedTask = await this.taskRepository.save(task)

        // Генерируем читаемый ID с помощью MessageFormatterService
        if (type === 'personal') {
            savedTask.readableId = MessageFormatterService.createTaskId('Personal', savedTask.id)
        } else {
            const chat = await this.chatRepository.findOne({
                where: { telegramId: data.chatId! }
            })
            const chatTitle = chat?.title || 'Group'
            savedTask.readableId = MessageFormatterService.createTaskId(chatTitle, savedTask.id)
        }

        const updatedTask = await this.taskRepository.save(savedTask)

        // Загружаем задачу со всеми связями для корректного форматирования
        return await this.taskRepository.findOne({
            where: { id: updatedTask.id },
            relations: ['author', 'chat', 'assignedUser', 'assignedRole']
        }) || updatedTask
    }

    // Получение задачи по ID
    async getTaskById(id: number): Promise<TaskEntity | null> {
        return await this.taskRepository.findOne({
            where: { id },
            relations: ['author', 'chat', 'assignedUser', 'assignedRole']
        })
    }

    // Получение всех личных задач пользователя
    async getPersonalTasks(userId: string): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: { 
                authorId: userId,
                type: 'personal'
            },
            relations: ['author'],
            order: { createdAt: 'DESC' }
        })
    }

    // Получение всех групповых задач чата
    async getGroupTasks(chatId: string): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: { 
                chatId,
                type: 'group'
            },
            relations: ['author', 'chat', 'assignedUser', 'assignedRole'],
            order: { createdAt: 'DESC' }
        })
    }

    // Получение задач, назначенных пользователю
    async getAssignedTasks(userId: string, chatId?: string): Promise<TaskEntity[]> {
        const where: any = {
            assignedUserId: userId
        }
        
        if (chatId) {
            where.chatId = chatId
        }

        return await this.taskRepository.find({
            where,
            relations: ['author', 'chat', 'assignedUser', 'assignedRole'],
            order: { createdAt: 'DESC' }
        })
    }

    // Получение задач, назначенных роли
    async getTasksByRole(roleId: number): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: { assignedRoleId: roleId },
            relations: ['author', 'chat', 'assignedUser', 'assignedRole'],
            order: { createdAt: 'DESC' }
        })
    }

    // Обновление задачи
    async updateTask(id: number, data: UpdateTaskDto): Promise<TaskEntity | null> {
        const task = await this.taskRepository.findOne({ where: { id } })
        if (!task) {
            return null
        }

        // Применяем обновления
        Object.assign(task, data)
        
        return await this.taskRepository.save(task)
    }

    // Удаление задачи
    async deleteTask(id: number): Promise<boolean> {
        const result = await this.taskRepository.delete(id)
        return (result.affected || 0) > 0
    }

    // Отметить задачу как выполненную/невыполненную
    async toggleTaskCompletion(id: number): Promise<TaskEntity | null> {
        const task = await this.taskRepository.findOne({ where: { id } })
        if (!task) {
            return null
        }

        task.isCompleted = !task.isCompleted
        return await this.taskRepository.save(task)
    }

    // Назначить задачу пользователю
    async assignToUser(taskId: number, userId: string): Promise<TaskEntity | null> {
        return await this.updateTask(taskId, {
            assignedUserId: userId,
            assignedRoleId: null // Очищаем назначение роли
        })
    }

    // Назначить задачу роли
    async assignToRole(taskId: number, roleId: number): Promise<TaskEntity | null> {
        return await this.updateTask(taskId, {
            assignedRoleId: roleId,
            assignedUserId: null // Очищаем назначение пользователю
        })
    }

    // Снять назначение задачи
    async unassignTask(taskId: number): Promise<TaskEntity | null> {
        return await this.updateTask(taskId, {
            assignedUserId: null,
            assignedRoleId: null
        })
    }

    // Получение всех задач с фильтрацией
    async getTasks(filters: {
        type?: 'personal' | 'group'
        authorId?: string
        chatId?: string
        assignedUserId?: string
        assignedRoleId?: number
        isCompleted?: boolean
        priority?: 'high' | 'medium' | 'low'
    } = {}): Promise<TaskEntity[]> {
        return await this.taskRepository.find({
            where: filters,
            relations: ['author', 'chat', 'assignedUser', 'assignedRole'],
            order: { createdAt: 'DESC' }
        })
    }
}