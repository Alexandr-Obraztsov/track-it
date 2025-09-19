import { TaskEntity } from '../entities/Task'
import { ChatMemberEntity } from '../entities/ChatMember'
import { TaskOperation, RoleOperation, Role } from '../types'
import { RoleEntity } from '../entities/Role'
import { UserEntity } from '../entities/User'

/**
 * Сервис для форматирования сообщений
 * Обрабатывает как типизированные объекты, так и Entity из базы данных
 */
export class MessageFormatterService {
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

	// Перевод приоритета на русский
	static translatePriority(priority: string): string {
		switch (priority) {
			case 'high':
				return 'Высокий'
			case 'medium':
				return 'Средний'
			case 'low':
				return 'Низкий'
			default:
				return priority
		}
	}

	// Форматирование результата операции с задачей
	static formatTaskOperation(operation: TaskOperation, success: boolean, task: TaskEntity): string {
		const taskTitle = `${task.readableId}: ${task.title}`

		switch (operation.operation) {
			case 'delete':
				return success ? `🗑️ Удалена задача "${taskTitle}"` : `❌ Не удалось удалить задачу "${taskTitle}"`

			case 'update':
				if (success) {
					let result = `🔄 Обновлена задача ${taskTitle}\n`

					result += this.formatTask(task) + '\n'

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
				return success ? `✅ Создана роль "${role.name}"` : `❌ Не удалось создать роль "${role.name}"`

			case 'delete':
				return success ? `🗑️ Удалена роль "${role.name}"` : `❌ Не удалось удалить роль "${role.name}"`

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
					result += `👤 Пользователь: ${operation.targetUserId}\n`
					return result
				} else {
					return `❌ Не удалось назначить роль "${role.name}" пользователю ${operation.targetUserId}`
				}

			case 'unassign':
				return success
					? `👤 Роль "${role.name}" снята с пользователя ${operation.targetUserId}`
					: `❌ Не удалось снять роль "${role.name}" с пользователя ${operation.targetUserId}`

			default:
				return `❓ Неизвестная операция с ролью "${role.name}"`
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

	static formatTask(task: TaskEntity): string {
		let result = `${task.readableId}\n`
		result += `📝 Название: ${task.title}\n`
		result += `📋 Описание: ${task.description}\n`
		result += `🔥 Приоритет: ${this.translatePriority(task.priority)}\n`
		result += `✨ Статус: ${task.isCompleted ? 'Выполнена' : 'Активна'}\n`

		if (task.deadline) {
			result += `⏰ Дедлайн: ${new Date(task.deadline).toLocaleString('ru-RU')}\n`
		}

		if (task.assignedUser) {
			result += `👥 Назначена на: ${this.getTag(task.assignedUser)}\n`
		} else if (task.assignedRole) {
			result += `👥 Назначена на роль: ${task.assignedRole.name}\n`
		}

		return result
	}
}
