import { TaskEntity } from '../../entities/Task'
import { ChatMemberEntity } from '../../entities/ChatMember'
import { Role, TaskOperation } from '../../types'
import { UserEntity } from '../../entities/User'
import { FormatRoleOperationParams } from './types'
import { RoleEntity } from '../../entities/Role'

/**
 * Сервис для форматирования сообщений
 * Обрабатывает как типизированные объекты, так и Entity из базы данных
 */
export class Formatter {
	// Создание читаемого ID задачи
	static createTaskId(chatTitle: string, taskLocalId: number): string {
		const prefix = chatTitle.slice(0, 3).toUpperCase()
		return `${prefix}-${taskLocalId}`
	}

	// Единое форматирование пользователя через тег
	static getTag(member: UserEntity | undefined): string {
		if (!member) {
			return 'Неизвестный пользователь'
		}
		return `@${member.username || member.firstName || 'unknown'}`
	}

	// Форматирование результата операции с задачей
	static formatTaskOperation(operation: TaskOperation, success: boolean, task: TaskEntity): string {
		switch (operation.operation) {
			case 'delete':
				return success
					? `🗑️ Удалена задача "${task.readableId}"`
					: `❌ Не удалось удалить задачу "${task.readableId}"`
			case 'update':
				return success && operation.updateData
					? `🔄 Обновлена задача "${task.readableId}":\n${this.formatTask(operation.updateData)}`
					: `❌ Не удалось обновить задачу "${task.readableId}"`
			default:
				return `❓ Неизвестная операция с задачей "${task.readableId}"`
		}
	}

	// Форматирование результата операции с ролью
	static formatRoleOperation(operation: FormatRoleOperationParams, success: boolean, role?: RoleEntity): string {
		switch (operation.operation) {
			case 'create':
				return success
					? `✅ Создана роль "${role!.name}"`
					: `❌ Не удалось создать роль "${operation.roleName}"`
			case 'delete':
				return success
					? `🗑️ Удалена роль "${role!.name}"`
					: `❌ Не удалось удалить роль "${operation.roleName ?? role?.name}"`
			case 'update':
				return success
					? `🔄 Роль обновлена: "${role!.name}" -> "${operation.newRoleName}"`
					: `❌ Не удалось переименовать роль "${operation.roleName ?? role?.name}"`
			case 'assign':
				return success
					? `👤 Роль "${role!.name}" назначена пользователю ${this.getTag(operation.targetUser!)}`
					: `❌ Не удалось назначить роль "${role!.name}" пользователю ${this.getTag(operation.targetUser!)}`
			case 'unassign':
				return success
					? `👤 Роль "${role!.name}" снята с пользователя ${this.getTag(operation.targetUser!)}`
					: `❌ Не удалось снять роль "${role!.name}" с пользователя ${this.getTag(operation.targetUser!)}`

			default:
				return `❓ Неизвестная операция с ролью`
		}
	}

	// Форматирование списка участников
	static formatMembersList(members: ChatMemberEntity[]): string {
		if (members.length === 0) {
			return '👥 Участники группы отсутствуют'
		}

		let response = '\n👥 Участники группы:\n'
		members.forEach((member, index) => {
			const memberTag = this.getTag(member.user)
			response += `${index + 1}. ${member.user.firstName} ${member.user.lastName || ''} (${memberTag}) - ${member.role?.name || 'без роли'}\n`
		})
		return response
	}

	static formatTasksList(tasks: TaskEntity[]): string {
		if (tasks.length === 0) {
			return `📋 Задач пока нет`
		}

		let response = `\n📋 Список задач:\n\n`
		tasks.forEach(task => {
			response += `${this.formatTask(task)}\n`
		})
		return response
	}

	// Форматирование списка ролей
	static formatRolesList(roles: Role[]): string {
		if (roles.length === 0) {
			return '🎭 Роли в группе отсутствуют'
		}

		let response = '\n🎭 Роли в группе:\n'
		roles.forEach((role, index) => {
			response += `${index + 1}. ${role.name}\n`
		})
		return response
	}

	static formatTask(task: Partial<TaskEntity>): string {
		const result = []
		if (task.readableId) result.push(`<b>${task.readableId}</b>`)
		if (task.title) result.push(`<b>${task.title}</b>`)
		if (task.description) result.push(`<i>${task.description}</i>`)
		if (task.deadline) result.push(`До: ${new Date(task.deadline).toLocaleString('ru-RU')}!`)
		if (task.assignedUser) result.push(`${this.getTag(task.assignedUser)}`)
		if (task.assignedRole) result.push(`${task.assignedRole.name}`)

		return result.join('\n')
	}
}
