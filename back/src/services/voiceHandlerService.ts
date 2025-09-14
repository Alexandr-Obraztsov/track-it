import TelegramBot from 'node-telegram-bot-api'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { GeminiService, GroupMember } from './geminiService'
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'
import { MessageFormatterService } from './messageFormatterService'

// Сервис для обработки голосовых сообщений
export class VoiceHandlerService {
    private taskService: TaskService
    private chatService: ChatService
    private roleService: RoleService
    private geminiService?: GeminiService

    constructor(
        taskService: TaskService,
        chatService: ChatService,
        roleService: RoleService,
        geminiService?: GeminiService
    ) {
        this.taskService = taskService
        this.chatService = chatService
        this.roleService = roleService
        this.geminiService = geminiService
        this.ensureDownloadsDirectory()
    }

    // Создание директории для загрузок, если не существует
    private ensureDownloadsDirectory(): void {
        const downloadsDir = path.join(__dirname, '../downloads')
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true })
        }
    }

    // Конвертация OGG в MP3
    private async convertOggToMp3(inputPath: string, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('mp3')
                .on('end', () => resolve())
                .on('error', (err: any) => reject(err))
                .save(outputPath)
        })
    }

    // Функция для перевода приоритета на русский
    private translatePriority(priority: 'high' | 'medium' | 'low'): string {
        switch (priority) {
            case 'high': return 'высокий'
            case 'medium': return 'средний'
            case 'low': return 'низкий'
            default: return priority
        }
    }

    // Функция для получения эмодзи роли
    private getRoleIcon(roleName?: string): string {
        if (!roleName) return '🎭'
        
        switch (roleName.toLowerCase()) {
            case 'admin': 
            case 'administrator': 
                return '👑'
            case 'moderator': 
            case 'mod': 
                return '🛡️'
            default: 
                return '🎭'
        }
    }

    // Основной метод обработки голосового сообщения
    async handleVoiceMessage(bot: TelegramBot, msg: any): Promise<void> {
        const chatId = msg.chat.id.toString()
        const userId = msg.from!.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
        const fileId = msg.voice!.file_id
        const oggFileName = `voice_${Date.now()}.ogg`
        const mp3FileName = `voice_${Date.now()}.mp3`
        const downloadsDir = path.join(__dirname, '../downloads')
        const oggPath = path.join(downloadsDir, oggFileName)
        const mp3Path = path.join(downloadsDir, mp3FileName)

        try {
            console.log(`Processing voice message with fileId: ${fileId}`)

            // Ставим реакцию думающего смайлика для индикации обработки
            try {
                await bot.setMessageReaction(chatId, msg.message_id, {
                    reaction: [{ type: 'emoji', emoji: '🤔' as any }],
                    is_big: false
                })
            } catch (reactionError) {
                console.warn('Не удалось поставить реакцию:', reactionError)
                // Продолжаем обработку даже если реакция не сработала
            }

            // Скачиваем файл
            const fileInfo = await bot.getFile(fileId)
            console.log(`File info:`, fileInfo)

            const downloadResult = await bot.downloadFile(fileId, downloadsDir)
            console.log(`Download result type:`, typeof downloadResult)

            let downloadedFilePath: string

            if (typeof downloadResult === 'string') {
                downloadedFilePath = downloadResult
                console.log(`Downloaded to: ${downloadedFilePath}`)
            } else {
                throw new Error('Download returned a stream instead of file path')
            }

            // Переименовываем файл
            if (fs.existsSync(downloadedFilePath)) {
                fs.renameSync(downloadedFilePath, oggPath)
                console.log(`Renamed to: ${oggPath}`)
            } else {
                throw new Error(`Downloaded file not found at ${downloadedFilePath}`)
            }

            if (!fs.existsSync(oggPath)) {
                throw new Error(`OGG file not found at ${oggPath}`)
            }

            // Конвертируем в MP3
            await this.convertOggToMp3(oggPath, mp3Path)

            if (!fs.existsSync(mp3Path)) {
                throw new Error(`MP3 file not created at ${mp3Path}`)
            }

            // Получаем контекст для Gemini
            let members: GroupMember[] = []
            let existingTasks: any[] = []
            let existingRoles: any[] = []
            let userRole: string | null = null
            
            if (isGroup) {
                try {
                    const chatMembers = await this.chatService.getChatMembers(chatId)
                    members = chatMembers.map(member => ({
                        name: member.firstName || member.username || 'Неизвестный',
                        username: member.username,
                        userId: member.userId
                    }))
                    
                    existingTasks = await this.taskService.getTasksByChat(chatId)
                    existingRoles = await this.chatService.getChatRolesWithMembers(chatId)
                    
                    const currentMember = await this.chatService.getMemberWithRole(chatId, userId)
                    userRole = currentMember?.role?.name || null
                } catch (error) {
                    console.error('Ошибка получения контекста группы:', error)
                }
            } else {
                try {
                    existingTasks = await this.taskService.getPersonalTasks(userId)
                } catch (error) {
                    console.error('Ошибка получения персональных задач:', error)
                }
            }

            // Обрабатываем с помощью Gemini
            const geminiResponse = this.geminiService ? 
                await this.geminiService.processAudio(mp3Path, members, existingTasks, userRole, existingRoles) : 
                'Gemini AI is not configured'

            // Выводим сырой ответ нейронки в среде разработки
            if (process.env.NODE_ENV === 'development') {
                console.log('=== RAW GEMINI RESPONSE ===')
                console.log(JSON.stringify(geminiResponse, null, 2))
                console.log('=== END GEMINI RESPONSE ===')
            }

            // Формируем ответ пользователю
            let formattedResponse: string
            if (typeof geminiResponse === 'string') {
                formattedResponse = geminiResponse
            } else {
                formattedResponse = await this.processGeminiResponse(
                    geminiResponse, 
                    chatId, 
                    userId, 
                    msg.chat.title || 'Chat', 
                    isGroup, 
                    members
                )
            }

            // Отправляем ответ пользователю
            bot.sendMessage(chatId, formattedResponse)

            // Ставим реакцию галочки после успешной обработки
            try {
                await bot.setMessageReaction(chatId, msg.message_id, {
                    reaction: [{ type: 'emoji', emoji: '✅' as any }],
                    is_big: false
                })
            } catch (reactionError) {
                console.warn('Не удалось поставить финальную реакцию:', reactionError)
            }

            // Очищаем файлы
            this.cleanupFiles(oggPath, mp3Path)

            console.log(`Voice message processed successfully: ${mp3FileName}`)
        } catch (error) {
            console.error('Error processing voice message:', error)
            
            // Ставим реакцию ошибки при неудачной обработке
            try {
                await bot.setMessageReaction(chatId, msg.message_id, {
                    reaction: [{ type: 'emoji', emoji: '❌' as any }],
                    is_big: false
                })
            } catch (reactionError) {
                console.warn('Не удалось поставить реакцию ошибки:', reactionError)
            }
            
            this.handleVoiceError(bot, chatId, error, oggPath, mp3Path)
        }
    }

    // Обработка ответа от Gemini
    private async processGeminiResponse(
        geminiResponse: any,
        chatId: string,
        userId: string,
        chatTitle: string,
        isGroup: boolean,
        members: GroupMember[]
    ): Promise<string> {
        let formattedResponse = ''
        
        // Сначала создаем роли
        const createdRoles: { [name: string]: number } = {}
        if (geminiResponse.roles && geminiResponse.roles.length > 0 && isGroup) {
            formattedResponse += 'Создаю роли:\n'
            for (const roleData of geminiResponse.roles) {
                try {
                    const role = await this.roleService.createRole({
                        name: roleData.name,
                        chatId: chatId
                    })
                    createdRoles[roleData.name] = role.id
                    formattedResponse += `✅ Роль "${roleData.name}" создана\n`
                } catch (dbError) {
                    console.error('Ошибка создания роли:', dbError)
                    formattedResponse += `❌ Ошибка создания роли "${roleData.name}"\n`
                }
            }
            formattedResponse += '\n'
        }

        // Создаем задачи
        if (geminiResponse.tasks && geminiResponse.tasks.length > 0) {
            formattedResponse += 'Найденные задачи:\n'
            
            for (const task of geminiResponse.tasks) {
                try {
                    let assignedToUserId: string | undefined = undefined
                    let assignedToRoleId: number | undefined = undefined

                    // Определяем назначение задачи
                    if (task.assignedToUser && isGroup) {
                        const chatMembers = await this.chatService.getChatMembers(chatId)
                        const assignedMember = chatMembers.find(member => 
                            (member.firstName && member.firstName.toLowerCase().includes(task.assignedToUser!.toLowerCase())) ||
                            (member.username && member.username.toLowerCase().includes(task.assignedToUser!.toLowerCase()))
                        )
                        if (assignedMember) {
                            assignedToUserId = assignedMember.userId
                        }
                    }

                    if (task.assignedToRole && createdRoles[task.assignedToRole]) {
                        assignedToRoleId = createdRoles[task.assignedToRole]
                    }

                    let createdTask: any

                    if (isGroup) {
                        const chat = await this.chatService.getOrCreateChat(chatId, chatTitle, undefined)
                        createdTask = await this.taskService.createTaskWithAssignment({
                            title: task.title,
                            description: task.description,
                            priority: task.priority,
                            deadline: task.deadline ? new Date(task.deadline) : undefined,
                            userId: userId,
                            chatId: chatId,
                            assignedToUserId,
                            assignedToRoleId
                        })
                    } else {
                        createdTask = await this.taskService.createPersonalTask({
                            ...task,
                            userId: userId
                        })
                    }

                    // Получаем информацию о создателе задачи
                    let creatorUsername: string | undefined
                    if (isGroup) {
                        const chatMembers = await this.chatService.getChatMembers(chatId)
                        const creator = chatMembers.find(member => member.userId === userId)
                        creatorUsername = creator?.username
                    }

                    // Используем полное форматирование задачи
                    const taskId = MessageFormatterService.createTaskId(chatTitle, createdTask.id)
                    formattedResponse += MessageFormatterService.formatTaskCreation(
                        createdTask,
                        taskId,
                        creatorUsername || userId,
                        task.assignedToUser,
                    ) + '\n'

                } catch (dbError) {
                    console.error('Ошибка сохранения задачи в БД:', dbError)
                    formattedResponse += `❌ Ошибка создания задачи "${task.title}"\n`
                }
            }
        } else {
            formattedResponse += 'Новых задач не найдено\n'
        }

        // Обрабатываем операции с задачами
        if (geminiResponse.taskOperations && geminiResponse.taskOperations.length > 0) {
            formattedResponse += '\n🔄 Операции с задачами:\n'
            formattedResponse += await this.processTaskOperations(geminiResponse.taskOperations, chatId, userId, isGroup)
        }

        // Обрабатываем операции с ролями
        if (geminiResponse.roleOperations && geminiResponse.roleOperations.length > 0 && isGroup) {
            formattedResponse += '\n🎭 Операции с ролями:\n'
            formattedResponse += await this.processRoleOperations(geminiResponse.roleOperations, chatId, members)
        }

        // Обрабатываем запросы на просмотр информации
        if (geminiResponse.viewRequests && geminiResponse.viewRequests.length > 0) {
            formattedResponse += '\n📊 Информация:\n'
            formattedResponse += await this.processViewRequests(geminiResponse.viewRequests, chatId, userId, isGroup)
        }

        return formattedResponse
    }

    // Обработка операций с задачами
    private async processTaskOperations(operations: any[], chatId: string, userId: string, isGroup: boolean): Promise<string> {
        let response = ''
        
        for (const operation of operations) {
            try {
                const taskId = parseInt(operation.taskId)
                
                switch (operation.operation) {
                    case 'delete':
                        const deleteSuccess = isGroup ? 
                            await this.taskService.deleteGroupTask(taskId) :
                            await this.taskService.deleteTask(taskId, userId)
                        
                        response += deleteSuccess ? 
                            `✅ Задача #${taskId} удалена\n` : 
                            `❌ Не удалось удалить задачу #${taskId}\n`
                        break

                    case 'complete':
                        const updateData = { isCompleted: true }
                        const completeTask = isGroup ?
                            await this.taskService.updateGroupTask(taskId, updateData) :
                            await this.taskService.updateTask(taskId, userId, updateData)
                        
                        response += completeTask ? 
                            `✅ Задача #${taskId} отмечена как выполненная\n` : 
                            `❌ Не удалось отметить задачу #${taskId} как выполненную\n`
                        break

                    case 'update':
                        if (operation.updateData) {
                            const updateData: any = {}
                            
                            if (operation.updateData.title) updateData.title = operation.updateData.title
                            if (operation.updateData.description) updateData.description = operation.updateData.description
                            if (operation.updateData.priority) updateData.priority = operation.updateData.priority
                            if (operation.updateData.deadline) updateData.deadline = operation.updateData.deadline
                            if (operation.updateData.isCompleted !== undefined) updateData.isCompleted = operation.updateData.isCompleted

                            const updatedTask = isGroup ?
                                await this.taskService.updateGroupTask(taskId, updateData) :
                                await this.taskService.updateTask(taskId, userId, updateData)
                            
                            response += updatedTask ? 
                                `✅ Задача #${taskId} обновлена\n` : 
                                `❌ Не удалось обновить задачу #${taskId}\n`
                        }
                        break
                }
            } catch (operationError) {
                console.error('Ошибка при выполнении операции с задачей:', operationError)
                response += `❌ Ошибка при выполнении операции с задачей #${operation.taskId}\n`
            }
        }
        
        return response
    }

    // Обработка операций с ролями
    private async processRoleOperations(operations: any[], chatId: string, members: GroupMember[]): Promise<string> {
        let response = ''
        
        for (const operation of operations) {
            try {
                switch (operation.operation) {
                    case 'create':
                        try {
                            await this.roleService.createRole({
                                name: operation.roleName,
                                chatId: chatId
                            })
                            response += `✅ Роль "${operation.roleName}" создана\n`
                        } catch (error) {
                            response += `❌ Ошибка создания роли "${operation.roleName}"\n`
                        }
                        break

                    case 'delete':
                        const deleteSuccess = await this.roleService.deleteRoleByName(chatId, operation.roleName)
                        response += deleteSuccess ? 
                            `✅ Роль "${operation.roleName}" удалена\n` : 
                            `❌ Не удалось удалить роль "${operation.roleName}"\n`
                        break

                    case 'update':
                        if (operation.newRoleName) {
                            const updatedRole = await this.roleService.updateRoleByName(
                                chatId, 
                                operation.roleName, 
                                operation.newRoleName
                            )
                            response += updatedRole ? 
                                `✅ Роль "${operation.roleName}" переименована в "${operation.newRoleName}"\n` : 
                                `❌ Не удалось переименовать роль "${operation.roleName}"\n`
                        }
                        break

                    case 'assign':
                        if (operation.targetUser) {
                            const targetMember = members.find(member => 
                                (member.name && member.name.toLowerCase().includes(operation.targetUser!.toLowerCase())) ||
                                (member.username && member.username.toLowerCase().includes(operation.targetUser!.toLowerCase()))
                            )
                            
                            if (targetMember && targetMember.username) {
                                const role = await this.roleService.getRoleByName(chatId, operation.roleName)
                                if (role) {
                                    const success = await this.chatService.assignRoleToUser(chatId, targetMember.userId, role.id)
                                    response += success ? 
                                        `✅ Роль "${operation.roleName}" назначена пользователю ${operation.targetUser}\n` : 
                                        `❌ Не удалось назначить роль "${operation.roleName}" пользователю ${operation.targetUser}\n`
                                } else {
                                    response += `❌ Роль "${operation.roleName}" не найдена\n`
                                }
                            } else {
                                response += `❌ Пользователь ${operation.targetUser} не найден\n`
                            }
                        }
                        break

                    case 'unassign':
                        if (operation.targetUser) {
                            const targetMember = members.find(member => 
                                (member.name && member.name.toLowerCase().includes(operation.targetUser!.toLowerCase())) ||
                                (member.username && member.username.toLowerCase().includes(operation.targetUser!.toLowerCase()))
                            )
                            
                            if (targetMember && targetMember.username) {
                                const success = await this.chatService.removeRoleFromUser(chatId, targetMember.userId)
                                response += success ? 
                                    `✅ Роль снята с пользователя ${operation.targetUser}\n` : 
                                    `❌ Не удалось снять роль с пользователя ${operation.targetUser}\n`
                            } else {
                                response += `❌ Пользователь ${operation.targetUser} не найден\n`
                            }
                        }
                        break
                }
            } catch (operationError) {
                console.error('Ошибка при выполнении операции с ролью:', operationError)
                response += `❌ Ошибка при выполнении операции с ролью "${operation.roleName}"\n`
            }
        }
        
        return response
    }

    // Обработка запросов на просмотр информации
    private async processViewRequests(requests: any[], chatId: string, userId: string, isGroup: boolean): Promise<string> {
        let response = ''
        
        for (const request of requests) {
            try {
                switch (request.type) {
                    case 'tasks':
                        if (isGroup) {
                            const tasks = await this.taskService.getTasksByChat(chatId)
                            response += MessageFormatterService.formatTasksList(tasks, 'Все задачи группы') + '\n'
                        } else {
                            const tasks = await this.taskService.getPersonalTasks(userId)
                            response += MessageFormatterService.formatTasksList(tasks, 'Ваши персональные задачи') + '\n'
                        }
                        break

                    case 'members':
                        if (isGroup) {
                            const chatMembers = await this.chatService.getChatMembers(chatId)
                            response += MessageFormatterService.formatMembersList(chatMembers) + '\n'
                        } else {
                            response += '❌ Команда показа участников доступна только в группах\n'
                        }
                        break

                    case 'roles':
                        if (isGroup) {
                            const rolesWithMembers = await this.chatService.getChatRolesWithMembers(chatId)
                            response += MessageFormatterService.formatRolesList(rolesWithMembers) + '\n'
                        } else {
                            response += '❌ Команда показа ролей доступна только в группах\n'
                        }
                        break

                    case 'userTasks':
                        if (isGroup) {
                            const tasks = await this.taskService.getTasksByChat(chatId)
                            const userTasks = tasks.filter(task => task.assignedToUserId === userId)
                            response += MessageFormatterService.formatTasksList(userTasks, 'Ваши задачи в группе') + '\n'
                        } else {
                            const tasks = await this.taskService.getPersonalTasks(userId)
                            response += MessageFormatterService.formatTasksList(tasks, 'Ваши персональные задачи') + '\n'
                        }
                        break

                    default:
                        response += `❌ Неизвестный тип запроса: ${request.type}\n`
                }
            } catch (error) {
                console.error(`Ошибка при обработке запроса ${request.type}:`, error)
                response += `❌ Ошибка при получении информации ${request.type}\n`
            }
        }
        
        return response
    }

    // Очистка файлов
    private cleanupFiles(oggPath: string, mp3Path: string): void {
        if (fs.existsSync(oggPath)) {
            fs.unlinkSync(oggPath)
            console.log(`Cleaned up OGG file: ${oggPath}`)
        }
        if (fs.existsSync(mp3Path)) {
            fs.unlinkSync(mp3Path)
            console.log(`Cleaned up MP3 file: ${mp3Path}`)
        }
    }

    // Обработка ошибок
    private handleVoiceError(bot: TelegramBot, chatId: string, error: any, oggPath: string, mp3Path: string): void {
        let errorMessage = 'Unknown error occurred'
        let isProxyError = false

        if (error instanceof Error) {
            errorMessage = error.message

            if (
                errorMessage.includes('timeout') ||
                errorMessage.includes('ECONNREFUSED') ||
                errorMessage.includes('ENOTFOUND') ||
                errorMessage.includes('proxy')
            ) {
                isProxyError = true
                console.warn('Proxy-related error detected:', errorMessage)
            }
        }

        let userMessage = `Error processing voice message: ${errorMessage}`

        if (isProxyError) {
            userMessage += '\n\nNote: There may be connectivity issues. The system will retry with direct connection if available.'
        }

        bot.sendMessage(chatId, userMessage)

        // Очищаем файлы при ошибке
        try {
            this.cleanupFiles(oggPath, mp3Path)
        } catch (cleanupError) {
            console.warn('Error during cleanup:', cleanupError)
        }
    }
}