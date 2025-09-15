import { TaskEntity } from '../entities/Task'
import { ChatMemberEntity } from '../entities/ChatMember'
import { TaskOperation, RoleOperation, Role, GroupMember } from './geminiService'
import { RoleEntity } from '../entities/Role'

/**
 * Сервис для форматирования сообщений
 * Обрабатывает как типизированные объекты, так и Entity из базы данных
 */
export class MessageFormatterService {
    // Создание читаемого ID задачи
    static createTaskId(chatTitle: string, taskDbId: number): string {
        const prefix = chatTitle.slice(0, 3).toUpperCase()
        return `${prefix}-${taskDbId}`
    }

    // Единое форматирование пользователя через тег
    static getTag(member: ChatMemberEntity): string {
        return `@${member.username}`
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

    // Форматирование результата создания задачи
    static formatTaskCreation(
        task: TaskEntity, 
    ): string {
        let result = `✅ Создана задача ${task.readableId}\n\n`
        result += `📝 Название: ${task.title}\n`
        result += `📋 Описание: ${task.description}\n`
        result += `🔥 Приоритет: ${this.translatePriority(task.priority)}\n`

        result += `👤 Создатель: ${this.getTag(task.author)}\n`
        
        if (task.deadline) {
            result += `⏰ Срок выполнения: ${task.deadline}\n`
        }
        
        if (task.assignedToMember) {
            result += `✨ Назначена на: ${this.getTag(task.assignedToMember)}\n`
        } else if (task.assignedToRole) {
            result += `👥 Назначена на роль: ${task.assignedToRole.name}\n`
        } else {
            result += `👥 Исполнитель: Не назначен\n`
        }
        
        return result
    }

    // Форматирование результата операции с задачей
    static formatTaskOperation(operation: TaskOperation, success: boolean, task: TaskEntity): string {
        const taskTitle = `${task.readableId}: ${task.title}`

        switch (operation.operation) {
            case 'delete':
                return success ? 
                    `🗑️ Удалена задача "${taskTitle}"` : 
                    `❌ Не удалось удалить задачу "${taskTitle}"`
            
            case 'update':
                if (success) {
                    let result = `🔄 Обновлена задача ${taskTitle}\n`

                    result += "\n" + this.formatTask(task)
                    
                    return result
                } else {
                    return `❌ Не удалось обновить задачу ${taskTitle}`
                }
            
            default:
                return `❓ Неизвестная операция с задачей ${taskTitle}`
        }
    }

    // Форматирование результата операции с ролью
    static formatRoleOperation(operation: RoleOperation, success: boolean, role: RoleEntity): string {
        switch (operation.operation) {
            case 'create':
                return success ?
                    `✅ Создана роль "${role.name}"`
                    : `❌ Не удалось создать роль "${role.name}"`
            
            case 'delete':
                return success ? 
                    `🗑️ Удалена роль "${role.name}"` : 
                    `❌ Не удалось удалить роль "${role.name}"`
            
            case 'update':
                if (success) {
                    let result = `🔄 Роль обновлена\n\n`
                    result += `🎭 Старое название: "${role.name}"\n`
                    result += `🎭 Новое название: "${operation.newRoleName}"\n`
                    return result
                } else {
                    return `❌ Не удалось переименовать роль "${role.name}"`
                }
            
            case 'assign':
                if (success) {
                    let result = `👤 Роль назначена пользователю\n\n`
                    result += `🎭 Роль: "${role.name}"\n`
                    result += `👤 Пользователь: ${operation.targetUser}\n`
                    return result
                } else {
                    return `❌ Не удалось назначить роль "${role.name}" пользователю ${operation.targetUser}`
                }
            
            case 'unassign':
                return success ? 
                    `👤 Роль "${role.name}" снята с пользователя ${operation.targetUser}` : 
                    `❌ Не удалось снять роль "${role.name}" с пользователя ${operation.targetUser}`
            
            default:
                return `❓ Неизвестная операция с ролью "${role.name}"`
        }
    }

    // Форматирование списка участников
    static formatMembersList(members: ChatMemberEntity[]): string {
        if (members.length === 0) {
            return '👥 Участники группы отсутствуют'
        }

        let response = '👥 Участники группы:\n'
        members.forEach((member, index) => {
            const memberTag = this.getTag(member)
            response += `\n${index + 1}. ${member.firstName} ${member.lastName} (${memberTag}) - ${member.role?.name || 'без роли'}`
        })
        return response
    }

    static formatTasksList(
        tasks: TaskEntity[], 
        members: GroupMember[] = [], 
        roles: Role[] = []
    ): string {
        if (tasks.length === 0) {
            return `📋 Задач пока нет`
        }


        let response = `📋 Список задач:\n`
        tasks.forEach((task) => {
            response += `\n${this.formatTask(task)}`
        })
        return response
    }

    // Форматирование списка ролей
    static formatRolesList(roles: Role[]): string {
        if (roles.length === 0) {
            return '🎭 Роли в группе отсутствуют'
        }

        let response = '🎭 Роли в группе:\n'
        roles.forEach((role, index) => {
            response += `\n${index + 1}. ${role.name}`
        })
        return response
    }


    static formatTask(task: TaskEntity): string {
        let result = `🏎️ Тег: ${task.readableId}\n`
        result += `📝 Название: ${task.title}\n`
        result += `📋 Описание: ${task.description}\n`
        result += `🔥 Приоритет: ${this.translatePriority(task.priority)}\n`
        result += `✨ Статус: ${task.isCompleted ? 'Выполнена' : 'Активна'}\n`

        if (task.deadline) {
            result += `⏰ Срок выполнения: ${task.deadline}\n`
        }

        if (task.assignedToMember) {
            result += `👥 Назначена на: ${this.getTag(task.assignedToMember)}\n`
        } else if (task.assignedToRole) {
            result += `👥 Назначена на роль: ${task.assignedToRole.name}\n`
        }

        return result
    }
}