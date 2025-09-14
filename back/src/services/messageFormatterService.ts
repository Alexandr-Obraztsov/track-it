import { TaskOperation, RoleOperation } from './geminiService'

// Сервис для форматирования сообщений
export class MessageFormatterService {
    // Создание читаемого ID задачи
    static createTaskId(chatTitle: string, taskDbId: number): string {
        const prefix = chatTitle.slice(0, 3).toUpperCase()
        return `${prefix}-${taskDbId}`
    }

    // Парсинг ID задачи из читаемого формата
    static parseTaskId(taskIdStr: string): number | null {
        const match = taskIdStr.match(/^[A-Z]{3}-(\d+)$/)
        return match ? parseInt(match[1]) : null
    }

    // Единое форматирование пользователя через тег
    static formatUserTag(member: any): string {
        if (member.username) {
            return `@${member.username}`
        } else if (member.firstName) {
            const fullName = `${member.firstName}${member.lastName ? ' ' + member.lastName : ''}`
            return fullName
        } else {
            return 'Неизвестный пользователь'
        }
    }

    // Создание тега пользователя для уведомлений
    static createUserTag(username?: string): string {
        return username ? `@${username}` : ''
    }

    // Перевод приоритета на русский
    static translatePriority(priority: string): string {
        switch (priority) {
            case 'high': return 'Высокий'
            case 'medium': return 'Средний'
            case 'low': return 'Низкий'
            default: return priority
        }
    }

    // Форматирование результата создания роли
    static formatRoleCreation(roleName: string, success: boolean, roleData?: any): string {
        if (success && roleData) {
            let result = `✅ Создана роль "${roleName}"\n\n`
            result += `🎭 Название: ${roleData.name}\n`
            result += `🏢 Чат: ${roleData.chatId}\n`
            result += `📅 Создана: ${new Date().toLocaleString('ru-RU')}\n`
            result += `👥 Участников: ${roleData.membersCount || 0}\n`
            
            if (roleData.description) {
                result += `📝 Описание: ${roleData.description}\n`
            }
            
            return result
        } else if (success) {
            return `✅ Создана роль "${roleName}"`
        } else {
            return `❌ Ошибка создания роли "${roleName}"`
        }
    }

    // Форматирование результата создания задачи
    static formatTaskCreation(
        task: any, 
        userName: string,
        assignedUserName?: string, 
    ): string {
        const taskId = task.readableId || `#${task.id}`
        let result = `✅ Создана задача ${taskId}\n\n`
        result += `📝 Название: ${task.title}\n`
        result += `📋 Описание: ${task.description}\n`
        result += `🔥 Приоритет: ${this.translatePriority(task.priority)}\n`
        
        // Формируем тег создателя
        const creatorTag = userName.startsWith('@') ? userName : this.createUserTag(userName)
        result += `👤 Создатель: ${creatorTag}\n`
        
        if (task.deadline) {
            result += `⏰ Срок выполнения: ${task.deadline}\n`
        }
        
        if (assignedUserName) {
            result += `✨ Назначена на: ${assignedUserName}\n`
        } else if (task.assignedToUserId) {
            result += `👥 Назначена на: ID ${task.assignedToUserId}\n`
        } else if (task.assignedToRoleId) {
            result += `👥 Назначена на роль: ID ${task.assignedToRoleId}\n`
        } else {
            result += `👥 Исполнитель: Не назначен\n`
        }
        
        return result
    }

    // Форматирование результата операции с задачей
    static formatTaskOperation(operation: TaskOperation, success: boolean, chatTitle: string, taskData?: any): string {
        const taskReadableId = this.createTaskId(chatTitle, parseInt(operation.taskId))
        
        switch (operation.operation) {
            case 'delete':
                return success ? 
                    `🗑️ Удалена задача ${taskReadableId}` : 
                    `❌ Не удалось удалить задачу ${taskReadableId}`
            
            case 'complete':
                if (success && taskData) {
                    let result = `✅ Задача ${taskReadableId} отмечена как выполненная\n\n`
                    result += `📝 Название: ${taskData.title}\n`
                    result += `📋 Описание: ${taskData.description}\n`
                    result += `🔥 Приоритет: ${this.translatePriority(taskData.priority)}\n`
                    result += `✨ Статус: Выполнена\n`
                    result += `📅 Завершена: ${new Date().toLocaleString('ru-RU')}\n`
                    return result
                } else {
                    return success ? 
                        `✅ Задача ${taskReadableId} отмечена как выполненная` : 
                        `❌ Не удалось отметить задачу ${taskReadableId} как выполненную`
                }
            
            case 'update':
                if (success) {
                    let result = `🔄 Обновлена задача ${taskReadableId}\n\n`
                    
                    if (taskData) {
                        result += `📝 Название: ${taskData.title}\n`
                        result += `📋 Описание: ${taskData.description}\n`
                        result += `🔥 Приоритет: ${this.translatePriority(taskData.priority)}\n`
                        result += `✨ Статус: ${taskData.isCompleted ? 'Выполнена' : 'Активна'}\n`
                        result += `📅 Обновлена: ${new Date().toLocaleString('ru-RU')}\n`
                        
                        if (taskData.deadline) {
                            result += `⏰ Срок выполнения: ${taskData.deadline}\n`
                        }
                        
                        if (taskData.assignedToUserId) {
                            result += `👥 Назначена на: ID ${taskData.assignedToUserId}\n`
                        } else if (taskData.assignedToRoleId) {
                            result += `👥 Назначена на роль: ID ${taskData.assignedToRoleId}\n`
                        }
                    }
                    
                    if (operation.updateData) {
                        const changes = []
                        if (operation.updateData.title) changes.push(`название: "${operation.updateData.title}"`)
                        if (operation.updateData.description) changes.push(`описание: "${operation.updateData.description}"`)
                        if (operation.updateData.priority) changes.push(`приоритет: ${this.translatePriority(operation.updateData.priority)}`)
                        if (operation.updateData.deadline) changes.push(`срок: ${operation.updateData.deadline}`)
                        if (operation.updateData.assignedToUser) changes.push(`исполнитель: ${operation.updateData.assignedToUser}`)
                        if (operation.updateData.assignedToRole) changes.push(`роль: ${operation.updateData.assignedToRole}`)
                        if (operation.updateData.isCompleted !== undefined) {
                            changes.push(`статус: ${operation.updateData.isCompleted ? 'выполнена' : 'активна'}`)
                        }
                        
                        if (changes.length > 0) {
                            result += `\n📝 Изменения: ${changes.join(', ')}`
                        }
                    }
                    return result
                } else {
                    return `❌ Не удалось обновить задачу ${taskReadableId}`
                }
            
            default:
                return `❓ Неизвестная операция с задачей ${taskReadableId}`
        }
    }

    // Форматирование результата операции с ролью
    static formatRoleOperation(operation: RoleOperation, success: boolean, roleData?: any): string {
        switch (operation.operation) {
            case 'create':
                if (success && roleData) {
                    let result = `✅ Создана роль "${operation.roleName}"\n\n`
                    result += `🎭 Название: ${roleData.name}\n`
                    result += `🏢 Чат: ${roleData.chatId}\n`
                    result += `📅 Создана: ${new Date().toLocaleString('ru-RU')}\n`
                    result += `👥 Участников: ${roleData.membersCount || 0}\n`
                    return result
                } else {
                    return success ? 
                        `✅ Создана роль "${operation.roleName}"` : 
                        `❌ Не удалось создать роль "${operation.roleName}"`
                }
            
            case 'delete':
                return success ? 
                    `🗑️ Удалена роль "${operation.roleName}"` : 
                    `❌ Не удалось удалить роль "${operation.roleName}"`
            
            case 'update':
                if (success && roleData) {
                    let result = `🔄 Роль обновлена\n\n`
                    result += `🎭 Старое название: "${operation.roleName}"\n`
                    result += `🎭 Новое название: "${operation.newRoleName}"\n`
                    result += `🏢 Чат: ${roleData.chatId}\n`
                    result += `👥 Участников: ${roleData.membersCount || 0}\n`
                    result += `📅 Обновлена: ${new Date().toLocaleString('ru-RU')}\n`
                    return result
                } else {
                    return success ? 
                        `🔄 Роль "${operation.roleName}" переименована в "${operation.newRoleName}"` : 
                        `❌ Не удалось переименовать роль "${operation.roleName}"`
                }
            
            case 'assign':
                if (success && roleData) {
                    let result = `👤 Роль назначена пользователю\n\n`
                    result += `🎭 Роль: "${operation.roleName}"\n`
                    result += `👤 Пользователь: ${operation.targetUser}\n`
                    result += `🏢 Чат: ${roleData.chatId}\n`
                    result += `📅 Назначена: ${new Date().toLocaleString('ru-RU')}\n`
                    return result
                } else {
                    return success ? 
                        `👤 Роль "${operation.roleName}" назначена пользователю ${operation.targetUser}` : 
                        `❌ Не удалось назначить роль "${operation.roleName}" пользователю ${operation.targetUser}`
                }
            
            case 'unassign':
                return success ? 
                    `👤 Роль "${operation.roleName}" снята с пользователя ${operation.targetUser}` : 
                    `❌ Не удалось снять роль "${operation.roleName}" с пользователя ${operation.targetUser}`
            
            default:
                return `❓ Неизвестная операция с ролью "${operation.roleName}"`
        }
    }

    // Форматирование списка участников
    static formatMembersList(members: any[]): string {
        if (members.length === 0) {
            return '👥 Участники группы отсутствуют'
        }

        let response = '👥 Участники группы:\n'
        members.forEach((member, index) => {
            const memberTag = this.formatUserTag(member)
            const roleName = member.role?.name ? ` [${member.role.name}]` : ''
            response += `\n${index + 1}. ${memberTag}${roleName}`
        })
        return response
    }

    // Форматирование списка задач
    static formatTasksList(tasks: any[], title: string): string {
        if (tasks.length === 0) {
            return `📋 ${title}: задачи отсутствуют`
        }

        let response = `📋 ${title}:\n`
        tasks.forEach((task, index) => {
            const priorityEmoji = task.priority === 'high' ? '🔴' : 
                                 task.priority === 'medium' ? '🟡' : '🟢'
            const statusEmoji = task.isCompleted ? '✅' : '⏳'
            const taskId = task.readableId || `#${task.id}`
            const assignedInfo = task.assignedUser ? ` → ${this.formatUserTag(task.assignedUser)}` : ''
            const deadlineInfo = task.deadline ? ` (до ${new Date(task.deadline).toLocaleDateString('ru-RU')})` : ''
            
            response += `\n${taskId} ${statusEmoji} ${priorityEmoji} ${task.title}${assignedInfo}${deadlineInfo}`
            if (task.description && task.description !== task.title) {
                response += `\n   ${task.description}`
            }
        })
        return response
    }

    // Форматирование списка ролей
    static formatRolesList(roles: any[]): string {
        if (roles.length === 0) {
            return '🎭 Роли в группе отсутствуют'
        }

        let response = '🎭 Роли в группе:\n'
        roles.forEach((role, index) => {
            response += `\n${index + 1}. ${role.name} (${role.membersCount} участников)`
            if (role.members && role.members.length > 0) {
                // Форматируем участников через теги
                const memberTags = role.members.map((member: any) => this.formatUserTag(member))
                response += `\n   Участники: ${memberTags.join(', ')}`
            }
        })
        return response
    }
}