import TelegramBot = require('node-telegram-bot-api')
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { MessageFormatterService } from './messageFormatterService'

// Сервис для обработки текстовых команд с параметрами
export class TextCommandService {
    private taskService: TaskService
    private chatService: ChatService

    constructor(taskService: TaskService, chatService: ChatService) {
        this.taskService = taskService
        this.chatService = chatService
    }

    // Обработка команды добавления задачи
    async handleAddTask(bot: TelegramBot, msg: any, match: RegExpExecArray | null): Promise<void> {
        const chatId = msg.chat.id.toString()
        const userId = msg.from!.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!match || !match[1]) {
            bot.sendMessage(chatId, 'Использование: /add [описание задачи]')
            return
        }

        try {
            const taskTitle = match[1].trim()
            let task

            if (isGroup) {
                // Проверяем регистрацию в группе
                const member = await this.chatService.getMemberById(chatId, userId)
                if (!member) {
                    bot.sendMessage(chatId, 'Сначала зарегистрируйтесь в группе командой /register')
                    return
                }

                const chat = await this.chatService.getOrCreateChat(chatId, msg.chat.title || 'Unknown Group', msg.chat.username)
                task = await this.taskService.createGroupTask({
                    title: taskTitle,
                    description: taskTitle,
                    priority: 'medium',
                    deadline: null,
                    userId: userId,
                    chatId: chatId
                })
            } else {
                task = await this.taskService.createPersonalTask({
                    title: taskTitle,
                    description: taskTitle,
                    priority: 'medium',
                    deadline: null,
                    userId
                })
            }

            const taskId = MessageFormatterService.createTaskId(msg.chat.title || 'Chat', task.id)
            const response = MessageFormatterService.formatTaskCreation(
                task,
                taskId,
                msg.from!.first_name || msg.from!.username || 'Unknown'
            )
            
            bot.sendMessage(chatId, response)
        } catch (error) {
            console.error('Ошибка добавления задачи:', error)
            bot.sendMessage(chatId, 'Ошибка при добавлении задачи')
        }
    }

    // Обработка команды назначения задачи
    async handleAssignTask(bot: TelegramBot, msg: any, match: RegExpExecArray | null): Promise<void> {
        const chatId = msg.chat.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!isGroup) {
            bot.sendMessage(chatId, 'Назначение задач доступно только в групповых чатах')
            return
        }

        if (!match || !match[1]) {
            bot.sendMessage(chatId, 'Использование: /assign [ID задачи] @[username]')
            return
        }

        try {
            const parts = match[1].trim().split(' ')
            if (parts.length < 2) {
                bot.sendMessage(chatId, 'Использование: /assign [ID задачи] @[username]')
                return
            }

            const taskIdStr = parts[0]
            const username = parts[1].replace('@', '')

            // Парсим ID задачи из формата ABC-123
            const taskId = MessageFormatterService.parseTaskId(taskIdStr)
            if (!taskId) {
                bot.sendMessage(chatId, 'Неверный формат ID задачи. Используйте формат как ABC-123')
                return
            }

            // Находим задачу
            const task = await this.taskService.getGroupTaskById(taskId)
            if (!task || task.chatId !== chatId) {
                bot.sendMessage(chatId, 'Задача не найдена в этом чате')
                return
            }

            // Находим пользователя
            const members = await this.chatService.getChatMembers(chatId)
            const assignee = members.find(member => member.username === username)

            if (!assignee) {
                bot.sendMessage(chatId, `Пользователь @${username} не найден в группе`)
                return
            }

            // Назначаем задачу через обновление
            const updatedTask = await this.taskService.updateGroupTask(taskId, { assignedToUserId: assignee.userId })
            const displayTaskId = MessageFormatterService.createTaskId(msg.chat.title || 'Chat', task.id)
            
            bot.sendMessage(chatId, `✅ Задача ${displayTaskId} назначена пользователю @${username}`)
        } catch (error) {
            console.error('Ошибка назначения задачи:', error)
            bot.sendMessage(chatId, 'Ошибка при назначении задачи')
        }
    }

    // Обработка команды завершения задачи
    async handleCompleteTask(bot: TelegramBot, msg: any, match: RegExpExecArray | null): Promise<void> {
        const chatId = msg.chat.id.toString()
        const userId = msg.from!.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!match || !match[1]) {
            bot.sendMessage(chatId, 'Использование: /complete [ID задачи]')
            return
        }

        try {
            const taskIdStr = match[1].trim()
            
            // Парсим ID задачи из формата ABC-123
            const taskId = MessageFormatterService.parseTaskId(taskIdStr)
            if (!taskId) {
                bot.sendMessage(chatId, 'Неверный формат ID задачи. Используйте формат как ABC-123')
                return
            }

            let task
            if (isGroup) {
                task = await this.taskService.getGroupTaskById(taskId)
                if (!task || task.chatId !== chatId) {
                    bot.sendMessage(chatId, 'Задача не найдена в этом чате')
                    return
                }
            } else {
                task = await this.taskService.getTaskById(taskId, userId)
                if (!task || task.userId !== userId) {
                    bot.sendMessage(chatId, 'Задача не найдена среди ваших задач')
                    return
                }
            }

            // Завершаем задачу
            const updatedTask = isGroup ? 
                await this.taskService.updateGroupTask(taskId, { isCompleted: true }) :
                await this.taskService.updateTask(taskId, userId, { isCompleted: true })
            const displayTaskId = MessageFormatterService.createTaskId(msg.chat.title || 'Chat', task.id)
            
            bot.sendMessage(chatId, `✅ Задача ${displayTaskId} отмечена как выполненная!`)
        } catch (error) {
            console.error('Ошибка завершения задачи:', error)
            bot.sendMessage(chatId, 'Ошибка при завершении задачи')
        }
    }

    // Обработка команды удаления задачи
    async handleDeleteTask(bot: TelegramBot, msg: any, match: RegExpExecArray | null): Promise<void> {
        const chatId = msg.chat.id.toString()
        const userId = msg.from!.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!match || !match[1]) {
            bot.sendMessage(chatId, 'Использование: /delete [ID задачи]')
            return
        }

        try {
            const taskIdStr = match[1].trim()
            
            // Парсим ID задачи из формата ABC-123
            const taskId = MessageFormatterService.parseTaskId(taskIdStr)
            if (!taskId) {
                bot.sendMessage(chatId, 'Неверный формат ID задачи. Используйте формат как ABC-123')
                return
            }

            let task
            if (isGroup) {
                task = await this.taskService.getGroupTaskById(taskId)
                if (!task || task.chatId !== chatId) {
                    bot.sendMessage(chatId, 'Задача не найдена в этом чате')
                    return
                }
            } else {
                task = await this.taskService.getTaskById(taskId, userId)
                if (!task || task.userId !== userId) {
                    bot.sendMessage(chatId, 'Задача не найдена среди ваших задач')
                    return
                }
            }

            // Удаляем задачу
            const deleted = isGroup ? 
                await this.taskService.deleteGroupTask(taskId) :
                await this.taskService.deleteTask(taskId, userId)
            const displayTaskId = MessageFormatterService.createTaskId(msg.chat.title || 'Chat', task.id)
            
            if (deleted) {
                bot.sendMessage(chatId, `🗑️ Задача ${displayTaskId} удалена`)
            } else {
                bot.sendMessage(chatId, `❌ Не удалось удалить задачу ${displayTaskId}`)
            }
        } catch (error) {
            console.error('Ошибка удаления задачи:', error)
            bot.sendMessage(chatId, 'Ошибка при удалении задачи')
        }
    }
}