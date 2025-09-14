import TelegramBot = require('node-telegram-bot-api')
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'
import { GeminiService, AudioTranscriptionResponse } from './geminiService'
import { MessageFormatterService } from './messageFormatterService'

// Сервис для обработки голосовых сообщений
export class VoiceMessageProcessor {
    private taskService: TaskService
    private chatService: ChatService
    private roleService: RoleService
    private geminiService: GeminiService | null = null

    constructor(
        taskService: TaskService, 
        chatService: ChatService, 
        roleService: RoleService,
        geminiService?: GeminiService
    ) {
        this.taskService = taskService
        this.chatService = chatService
        this.roleService = roleService
        this.geminiService = geminiService || null
    }

    // Обработка создания ролей
    async processRoles(
        geminiResponse: AudioTranscriptionResponse,
        chatId: string,
        isGroup: boolean
    ): Promise<{ response: string, createdRoles: { [name: string]: number }, hasChanges: boolean }> {
        let response = ''
        let hasChanges = false
        const createdRoles: { [name: string]: number } = {}

        if (geminiResponse.roles && geminiResponse.roles.length > 0 && isGroup) {
            for (const roleData of geminiResponse.roles) {
                try {
                    const role = await this.roleService.createRole({
                        name: roleData.name,
                        chatId: chatId
                    })
                    createdRoles[roleData.name] = role.id
                    response += MessageFormatterService.formatRoleCreation(roleData.name, true, { ...roleData, ...role }) + '\n'
                    hasChanges = true
                } catch (dbError) {
                    console.error('Ошибка создания роли:', dbError)
                    response += MessageFormatterService.formatRoleCreation(roleData.name, false) + '\n'
                }
            }
            if (geminiResponse.roles.length > 0) response += '\n'
        }

        return { response, createdRoles, hasChanges }
    }

    // Обработка создания задач
    async processTasks(
        geminiResponse: AudioTranscriptionResponse,
        chatId: string,
        userId: string,
        chatTitle: string,
        isGroup: boolean,
        createdRoles: { [name: string]: number }
    ): Promise<{ response: string, hasChanges: boolean }> {
        let response = ''
        let hasChanges = false

        if (geminiResponse.tasks && geminiResponse.tasks.length > 0) {
            for (const task of geminiResponse.tasks) {
                try {
                    let assignedToUserId: string | undefined = undefined
                    let assignedToRoleId: number | undefined = undefined
                    let assignedUserName = ''
                    let assignedUserTag = ''

                    // Определяем назначение задачи
                    if (task.assignedToUser && isGroup) {
                        const chatMembers = await this.chatService.getChatMembers(chatId)
                        const assignedMember = chatMembers.find(member => 
                            (member.firstName && member.firstName.toLowerCase().includes(task.assignedToUser!.toLowerCase())) ||
                            (member.username && member.username.toLowerCase().includes(task.assignedToUser!.toLowerCase()))
                        )
                        if (assignedMember) {
                            assignedToUserId = assignedMember.userId
                            assignedUserName = MessageFormatterService.formatUserName(assignedMember)
                            assignedUserTag = MessageFormatterService.createUserTag(assignedMember.username)
                        }
                    }

                    if (task.assignedToRole && createdRoles[task.assignedToRole]) {
                        assignedToRoleId = createdRoles[task.assignedToRole]
                    }

                    let savedTask
                    if (isGroup) {
                        const chat = await this.chatService.getOrCreateChat(chatId, chatTitle, undefined)
                        savedTask = await this.taskService.createTaskWithAssignment({
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
                        savedTask = await this.taskService.createPersonalTask({
                            ...task,
                            userId: userId
                        })
                    }

                    // Формируем сообщение о созданной задаче
                    const taskId = MessageFormatterService.createTaskId(chatTitle, savedTask.id)
                    response += MessageFormatterService.formatTaskCreation(
                        savedTask, 
                        taskId, 
                        'Пользователь', // Можно передать имя создателя, если нужно
                        assignedUserName, 
                        assignedUserTag
                    ) + '\n'
                    
                    if (savedTask) hasChanges = true

                } catch (dbError) {
                    console.error('Ошибка сохранения задачи в БД:', dbError)
                    response += `❌ Ошибка создания задачи "${task.title}"\n`
                }
            }
        }

        return { response, hasChanges }
    }

    // Обработка операций с задачами
    async processTaskOperations(
        geminiResponse: AudioTranscriptionResponse,
        chatId: string,
        userId: string,
        chatTitle: string,
        isGroup: boolean,
        members: any[],
        createdRoles: { [name: string]: number }
    ): Promise<{ response: string, hasChanges: boolean }> {
        let response = ''
        let hasChanges = false

        if (geminiResponse.taskOperations && geminiResponse.taskOperations.length > 0) {
            for (const operation of geminiResponse.taskOperations) {
                try {
                    const taskId = parseInt(operation.taskId)
                    let success = false
                    
                    switch (operation.operation) {
                        case 'delete':
                            if (isGroup) {
                                success = await this.taskService.deleteGroupTask(taskId)
                            } else {
                                success = await this.taskService.deleteTask(taskId, userId)
                            }
                            break

                        case 'complete':
                            if (isGroup) {
                                const task = await this.taskService.updateGroupTask(taskId, { isCompleted: true })
                                success = !!task
                            } else {
                                const task = await this.taskService.updateTask(taskId, userId, { isCompleted: true })
                                success = !!task
                            }
                            break

                        case 'update':
                            if (operation.updateData) {
                                const updateData: any = {}
                                
                                if (operation.updateData.title) updateData.title = operation.updateData.title
                                if (operation.updateData.description) updateData.description = operation.updateData.description
                                if (operation.updateData.priority) updateData.priority = operation.updateData.priority
                                if (operation.updateData.deadline) updateData.deadline = operation.updateData.deadline
                                if (operation.updateData.isCompleted !== undefined) updateData.isCompleted = operation.updateData.isCompleted

                                // Обработка назначений
                                if (operation.updateData.assignedToUser) {
                                    const targetMember = members.find(member => 
                                        (member.name && member.name.toLowerCase().includes(operation.updateData!.assignedToUser!.toLowerCase())) ||
                                        (member.username && member.username.toLowerCase().includes(operation.updateData!.assignedToUser!.toLowerCase()))
                                    )
                                    if (targetMember) {
                                        updateData.assignedToUserId = targetMember.userId
                                    }
                                }

                                if (operation.updateData.assignedToRole && createdRoles[operation.updateData.assignedToRole]) {
                                    updateData.assignedToRoleId = createdRoles[operation.updateData.assignedToRole]
                                }

                                if (isGroup) {
                                    const task = await this.taskService.updateGroupTask(taskId, updateData)
                                    success = !!task
                                    if (task) {
                                        response += MessageFormatterService.formatTaskOperation(operation, success, chatTitle, task) + '\n'
                                    } else {
                                        response += MessageFormatterService.formatTaskOperation(operation, false, chatTitle) + '\n'
                                    }
                                } else {
                                    const task = await this.taskService.updateTask(taskId, userId, updateData)
                                    success = !!task
                                    if (task) {
                                        response += MessageFormatterService.formatTaskOperation(operation, success, chatTitle, task) + '\n'
                                    } else {
                                        response += MessageFormatterService.formatTaskOperation(operation, false, chatTitle) + '\n'
                                    }
                                }
                            }
                            break
                    }

                    // Для операций delete и complete тоже обновляем
                    if (operation.operation === 'delete' || operation.operation === 'complete') {
                        response += MessageFormatterService.formatTaskOperation(operation, success, chatTitle) + '\n'
                    }
                    
                    if (success) hasChanges = true

                } catch (operationError) {
                    console.error('Ошибка при выполнении операции с задачей:', operationError)
                    response += MessageFormatterService.formatTaskOperation(operation, false, chatTitle) + '\n'
                }
            }
        }

        return { response, hasChanges }
    }

    // Обработка операций с ролями
    async processRoleOperations(
        geminiResponse: AudioTranscriptionResponse,
        chatId: string,
        isGroup: boolean,
        members: any[]
    ): Promise<{ response: string, hasChanges: boolean }> {
        let response = ''
        let hasChanges = false

        if (geminiResponse.roleOperations && geminiResponse.roleOperations.length > 0 && isGroup) {
            for (const operation of geminiResponse.roleOperations) {
                try {
                    let success = false

                    switch (operation.operation) {
                        case 'create':
                            try {
                                await this.roleService.createRole({
                                    name: operation.roleName,
                                    chatId: chatId
                                })
                                success = true
                            } catch (error) {
                                success = false
                            }
                            break

                        case 'delete':
                            success = await this.roleService.deleteRoleByName(chatId, operation.roleName)
                            break

                        case 'update':
                            if (operation.newRoleName) {
                                const updatedRole = await this.roleService.updateRoleByName(
                                    chatId, 
                                    operation.roleName, 
                                    operation.newRoleName
                                )
                                success = !!updatedRole
                            }
                            break

                        case 'assign':
                            if (operation.targetUser) {
                                const role = await this.roleService.getRoleByName(chatId, operation.roleName)
                                if (role) {
                                    const targetMember = members.find(member => 
                                        (member.name && member.name.toLowerCase().includes(operation.targetUser!.toLowerCase())) ||
                                        (member.username && member.username.toLowerCase().includes(operation.targetUser!.toLowerCase()))
                                    )
                                    if (targetMember) {
                                        success = await this.chatService.assignRoleToUser(chatId, targetMember.userId, role.id)
                                    }
                                }
                            }
                            break

                        case 'unassign':
                            if (operation.targetUser) {
                                const targetMember = members.find(member => 
                                    (member.name && member.name.toLowerCase().includes(operation.targetUser!.toLowerCase())) ||
                                    (member.username && member.username.toLowerCase().includes(operation.targetUser!.toLowerCase()))
                                )
                                if (targetMember) {
                                    success = await this.chatService.removeRoleFromUser(chatId, targetMember.userId)
                                }
                            }
                            break
                    }

                    response += MessageFormatterService.formatRoleOperation(operation, success) + '\n'
                    if (success) hasChanges = true

                } catch (operationError) {
                    console.error('Ошибка при выполнении операции с ролью:', operationError)
                    response += MessageFormatterService.formatRoleOperation(operation, false) + '\n'
                }
            }
        }

        return { response, hasChanges }
    }

    // Обработка команд
    async processCommands(
        geminiResponse: AudioTranscriptionResponse,
        chatId: string,
        isGroup: boolean,
        bot: TelegramBot
    ): Promise<{ response: string, hasChanges: boolean }> {
        let response = ''
        let hasChanges = false

        if (geminiResponse.commands && geminiResponse.commands.length > 0) {
            for (const commandData of geminiResponse.commands) {
                try {
                    const command = commandData.command.toLowerCase()
                    
                    if (command === '/members' && isGroup) {
                        const membersWithRoles = await this.chatService.getChatMembers(chatId)
                        const memberDetails = []
                        
                        for (const member of membersWithRoles) {
                            const memberWithRole = await this.chatService.getMemberWithRole(chatId, member.userId)
                            memberDetails.push(memberWithRole)
                        }
                        
                        const formattedList = MessageFormatterService.formatMembersList(memberDetails)
                        bot.sendMessage(chatId, formattedList)
                        hasChanges = true
                        
                    } else if (command === '/roles' && isGroup) {
                        const roles = await this.chatService.getChatRolesWithMembers(chatId)
                        const formattedList = MessageFormatterService.formatRolesList(roles)
                        bot.sendMessage(chatId, formattedList)
                        hasChanges = true
                    }
                } catch (commandError) {
                    console.error('Ошибка при выполнении команды:', commandError)
                }
            }
        }

        return { response, hasChanges }
    }
}