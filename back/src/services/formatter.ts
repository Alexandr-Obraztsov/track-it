import { UserEntity } from '../entities/User'
import { TaskEntity } from '../entities/Task'
import { RoleEntity } from '../entities/Role'
import { GeminiUser, GeminiRole, GeminiTask, GeminiChatMember } from '../types'

/**
 * Форматтер для работы с пользователями
 */
export class UserFormatter {
	/**
	 * Создает простой тег пользователя для упоминаний
	 */
	static createTag(user: UserEntity | undefined): string {
		if (!user) {
			return MessageFormatter.ERRORS.NOT_FOUND
		}
		return `@${user.username || user.firstName || 'unknown'}`
	}

	/**
	 * Создает красивое отображаемое имя пользователя с эмодзи
	 */
	static createDisplayName(user: UserEntity | undefined): string {
		if (!user) {
			return '❓ ' + MessageFormatter.ERRORS.NOT_FOUND
		}
		
		const name = `${user.firstName} ${user.lastName || ''}`.trim()
		const username = user.username ? ` (@${user.username})` : ''
		return name+username
	}

	/**
	 * Создает краткую информацию о пользователе
	 */
	static createShortInfo(user: UserEntity | undefined): string {
		if (!user) {
			return '❓ ' + MessageFormatter.VARIANTS.UNKNOWN
		}
		
		const name = `${user.firstName} ${user.lastName || ''}`.trim()
		const tag = this.createTag(user)
		return `${name} (${tag})`
	}

	/**
	 * Создает полную информацию о пользователе
	 */
	static createFullInfo(user: UserEntity | undefined): string {
		if (!user) {
			return '❓ ' + MessageFormatter.ERRORS.NOT_FOUND
		}

		const result = []
		result.push(`<b>${user.firstName} ${user.lastName || ''}</b>`)
		
		if (user.username) {
			result.push(`📱 @${user.username}`)
		}
		
		result.push(`🆔 ID: ${user.telegramId}`)
		result.push(`📅 Зарегистрирован: ${user.createdAt.toLocaleDateString('ru-RU')}`)
		
		return result.join('\n')
	}
}

/**
 * Форматтер для работы с задачами
 */
export class TaskFormatter {
	/**
	 * Создает читаемый ID задачи на основе названия чата и локального номера
	 */
	static createTaskId(chatTitle: string, taskLocalId: number): string {
		const prefix = chatTitle.slice(0, 3).toUpperCase()
		return `${prefix}-${taskLocalId}`
	}

	/**
	 * Форматирует информацию о дедлайне с красивым выводом
	 */
	static formatDeadline(deadline: Date): string {
		const deadlineDate = new Date(deadline)
		
		const dateStr = deadlineDate.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
		
		return dateStr
	}

	/**
	 * Форматирует одну задачу для отображения в списке или детальном просмотре
	 */
	static formatTask(task: TaskEntity): string {
		const result = []
		
		result.push(`<b>${task.readableId}: ${task.title}</b>`)
		
		// Описание задачи (только если есть и отличается от заголовка)
		if (task.description && task.description.trim() !== task.title.trim()) {
			result.push(`<i>${task.description}</i>`)
		}
		
		// Дедлайн
		if (task.deadline) {
			const deadlineFormatted = this.formatDeadline(task.deadline)
			result.push(`⏰ ${deadlineFormatted}`)
		}
		
		// Назначение с тегом FYI
		if (task.type === 'group') {
			if (task.assignedUser) {
				result.push(`${UserFormatter.createTag(task.assignedUser)} FYI`)
			} else if (task.assignedRole) {
				result.push(`${task.assignedRole.name} FYI`)
			}
		}
				
		return result.join('\n')
	}
}

/**
 * Форматтер для работы с ролями
 */
export class RoleFormatter {
	/**
	 * Форматирует информацию о роли для отображения в списках
	 */
	static formatRole(role: RoleEntity): string {
		const memberCount = role.members?.length || 0
		const memberText = MessageFormatter.getMemberPlural(memberCount)
		
		return `🎭 <b>${role.name}</b>\n👥 ${memberCount} ${memberText}`
	}

	/**
	 * Форматирует краткую информацию о роли
	 */
	static formatRoleShort(role: RoleEntity): string {
		const memberCount = role.members?.length || 0
		return `🎭 ${role.name} (${memberCount})`
	}

	/**
	 * Форматирует детальную информацию о роли с участниками
	 */
	static formatRoleDetailed(role: RoleEntity): string {
		const result = []
		result.push(`🎭 <b>${role.name}</b>`)
		
		if (role.members && role.members.length > 0) {
			const memberText = MessageFormatter.getMemberPlural(role.members.length)
			result.push(`👥 ${memberText} (${role.members.length}):`)
			role.members.forEach((member, index) => {
				const userInfo = UserFormatter.createShortInfo(member.user)
				result.push(`  ${index + 1}. ${userInfo}`)
			})
		} else {
			result.push('👥 Участники отсутствуют')
		}
		
		result.push(`📅 Создана: ${role.createdAt.toLocaleDateString('ru-RU')}`)
		
		return result.join('\n')
	}

	/**
	 * Форматирует информацию о создании новой роли
	 */
	static formatNewRole(role: RoleEntity): string {
		return `✨ <b>Создана новая роль!</b>\n🎭 ${role.name}`
	}

	/**
	 * Форматирует информацию о переименовании роли
	 */
	static formatRenamedRole(oldName: string, newName: string): string {
		return `🔄 <b>Роль переименована</b>\n🎭 "${oldName}" → "${newName}"`
	}

	/**
	 * Форматирует информацию о назначении роли пользователю
	 */
	static formatRoleAssigned(role: RoleEntity, user: any): string {
		return `👤 <b>Роль назначена</b>\n🎭 ${role.name}\n👤 ${UserFormatter.createDisplayName(user)}`
	}

	/**
	 * Форматирует информацию о снятии роли с пользователя
	 */
	static formatRoleUnassigned(role: RoleEntity, user: any): string {
		return `👤 <b>Роль снята</b>\n🎭 ${role.name}\n👤 ${UserFormatter.createDisplayName(user)}`
	}

	/**
	 * Форматирует информацию об удалении роли
	 */
	static formatRoleDeleted(role: RoleEntity): string {
		return `🗑️ <b>Роль удалена</b>\n🎭 ${role.name}`
	}
}

/**
 * Форматтер для работы с операциями над задачами
 */
export class OperationFormatter {
	/**
	 * Форматирует информацию о создании задачи
	 */
	static formatTaskCreated(task: TaskEntity): string {
		const result = []
		result.push(`✨ <b>Создана новая задача!</b>`)
		result.push(TaskFormatter.formatTask(task))
		return result.join('\n')
	}

	/**
	 * Форматирует информацию об обновлении задачи
	 */
	static formatTaskUpdated(task: TaskEntity): string {
		const result = []
		result.push(`🔄 <b>Задача обновлена!</b>`)
		result.push(TaskFormatter.formatTask(task))
		return result.join('\n')
	}

	/**
	 * Форматирует информацию об удалении задачи
	 */
	static formatTaskDeleted(task: TaskEntity): string {
		return `🗑️ <b>Задача удалена</b>\n📝 ${task.readableId}: ${task.title}`
	}

	/**
	 * Форматирует информацию о завершении задачи
	 */
	static formatTaskCompleted(task: TaskEntity): string {
		return `✅ <b>Задача выполнена!</b>\n📝 ${task.readableId}: ${task.title}`
	}

	/**
	 * Форматирует информацию о назначении задачи пользователю
	 */
	static formatTaskAssignedToUser(task: TaskEntity, user: any): string {
		return `👤 <b>Задача назначена</b>\n📝 ${task.readableId}: ${task.title}\n👤 ${UserFormatter.createDisplayName(user)}`
	}

	/**
	 * Форматирует информацию о назначении задачи роли
	 */
	static formatTaskAssignedToRole(task: TaskEntity, role: RoleEntity): string {
		return `🎭 <b>Задача назначена роли</b>\n📝 ${task.readableId}: ${task.title}\n🎭 ${role.name}`
	}

	/**
	 * Форматирует информацию об операции с задачей
	 */
	static formatTaskOperation(operation: string, task: TaskEntity): string {
		switch (operation) {
			case 'delete':
				return this.formatTaskDeleted(task)
			case 'update':
				return this.formatTaskUpdated(task)
			case 'complete':
				return this.formatTaskCompleted(task)
			default:
				return `🔄 <b>Операция выполнена</b>\n📝 ${task.readableId}: ${task.title}`
		}
	}

	/**
	 * Форматирует информацию об обновлении задачи с деталями изменений
	 */
	static formatTaskUpdate(oldTask: TaskEntity, newTask: TaskEntity, updateData: any): string {
		const changes = []
		
		// Проверяем изменения в заголовке
		if (updateData.title && oldTask.title !== newTask.title) {
			changes.push(`📝 <b>Название:</b> "${oldTask.title}" → "${newTask.title}"`)
		}
		
		// Проверяем изменения в описании
		if (updateData.description !== undefined) {
			if (oldTask.description !== newTask.description) {
				if (oldTask.description && newTask.description) {
					changes.push(`📄 <b>Описание:</b> "${oldTask.description}" → "${newTask.description}"`)
				} else if (newTask.description) {
					changes.push(`📄 <b>Описание:</b> добавлено "${newTask.description}"`)
				} else if (oldTask.description) {
					changes.push(`📄 <b>Описание:</b> удалено "${oldTask.description}"`)
				}
			}
		}
		
		// Проверяем изменения в дедлайне
		if (updateData.deadline !== undefined) {
			const oldDeadline = oldTask.deadline ? TaskFormatter.formatDeadline(oldTask.deadline) : 'не установлен'
			const newDeadline = newTask.deadline ? TaskFormatter.formatDeadline(newTask.deadline) : 'не установлен'
			
			if (oldDeadline !== newDeadline) {
				changes.push(`⏰ <b>Дедлайн:</b> ${oldDeadline} → ${newDeadline}`)
			}
		}
		
		// Проверяем изменения в назначении пользователю
		if (updateData.assignedUserId !== undefined) {
			const oldUser = oldTask.assignedUser ? UserFormatter.createDisplayName(oldTask.assignedUser) : 'не назначен'
			const newUser = newTask.assignedUser ? UserFormatter.createDisplayName(newTask.assignedUser) : 'не назначен'
			
			if (oldUser !== newUser) {
				changes.push(`👤 <b>Назначение:</b> ${oldUser} → ${newUser}`)
			}
		}
		
		// Проверяем изменения в назначении роли
		if (updateData.assignedRoleId !== undefined) {
			const oldRole = oldTask.assignedRole ? oldTask.assignedRole.name : 'не назначена'
			const newRole = newTask.assignedRole ? newTask.assignedRole.name : 'не назначена'
			
			if (oldRole !== newRole) {
				changes.push(`🎭 <b>Роль:</b> ${oldRole} → ${newRole}`)
			}
		}
		
		// Проверяем изменения в статусе выполнения
		if (updateData.isCompleted !== undefined && oldTask.isCompleted !== newTask.isCompleted) {
			const oldStatus = oldTask.isCompleted ? 'выполнена' : 'не выполнена'
			const newStatus = newTask.isCompleted ? 'выполнена' : 'не выполнена'
			changes.push(`✅ <b>Статус:</b> ${oldStatus} → ${newStatus}`)
		}
		
		// Формируем результат
		if (changes.length > 0) {
			return `🔄 <b>Задача обновлена!</b>\n📝 ${newTask.readableId}: ${newTask.title}\n\n${changes.join('\n')}`
		} else {
			return `🔄 <b>Задача обновлена!</b>\n📝 ${newTask.readableId}: ${newTask.title}`
		}
	}
}

/**
 * Форматтер для работы со списками
 */
export class ListFormatter {
	/**
	 * Форматирует список задач для отображения
	 */
	static formatTasksList(tasks: TaskEntity[], title: string = '📋 Задачи'): string {
		if (tasks.length === 0) {
			return MessageFormatter.BOT_MESSAGES.NO_TASKS
		}

		const result = []
		result.push(`<b>${title}</b>`)
		result.push('')

		tasks.forEach((task, index) => {
			result.push(`${index + 1}. ${TaskFormatter.formatTask(task)}`)
			if (index < tasks.length - 1) result.push('')
		})

		return result.join('\n')
	}

	/**
	 * Форматирует список ролей для отображения
	 */
	static formatRolesList(roles: RoleEntity[], title: string = '🎭 Роли'): string {
		if (roles.length === 0) {
			return `🎭 Ролей пока нет`
		}

		const result = []
		result.push(`<b>${title}</b>`)
		result.push('')

		roles.forEach((role, index) => {
			result.push(`${index + 1}. ${RoleFormatter.formatRole(role)}`)
			if (index < roles.length - 1) result.push('')
		})

		return result.join('\n')
	}

	/**
	 * Форматирует список участников чата
	 */
	static formatChatMembersList(members: any[], title: string = '👥 Участники чата'): string {
		if (members.length === 0) {
			return `${title}\n\n👥 Участников пока нет`
		}

		const result = []
		result.push(`<b>${title}</b>`)
		result.push('')

		members.forEach((member, index) => {
			const userInfo = UserFormatter.createShortInfo(member.user)
			const roleInfo = member.role ? ` (${member.role.name})` : ''
			result.push(`${index + 1}. ${userInfo}${roleInfo}`)
		})

		return result.join('\n')
	}
}

/**
 * Форматтер для работы с промптами Gemini AI
 */
export class PromptFormatter {
	/**
	 * Форматирует пользователя для промпта Gemini
	 */
	static formatUserForPrompt(user: UserEntity): GeminiUser {
		return {
			telegramId: user.telegramId,
			firstName: user.firstName,
			lastName: user.lastName || '',
			username: user.username || ''
		}
	}

	/**
	 * Форматирует роль для промпта Gemini
	 */
	static formatRoleForPrompt(role: RoleEntity): GeminiRole {
		return {
			id: role.id,
			name: role.name,
			chatId: role.chat.telegramId,
			memberIds: role.members?.map(member => member.user.telegramId) || []
		}
	}

	/**
	 * Форматирует задачу для промпта Gemini
	 */
	static formatTaskForPrompt(task: TaskEntity): GeminiTask {
		return {
			id: task.id,
			readableId: task.readableId,
			title: task.title,
			description: task.description || undefined,
			deadline: task.deadline?.toISOString() || null,
			type: task.type,
			chatId: task.chat?.telegramId,
			assignedUserId: task.assignedUser?.telegramId || undefined,
			assignedRoleId: task.assignedRole?.id || undefined,
			isCompleted: task.isCompleted
		}
	}

	/**
	 * Форматирует участника чата для промпта Gemini
	 */
	static formatChatMemberForPrompt(member: any): GeminiChatMember {
		return {
			userId: member.user.telegramId,
			firstName: member.user.firstName,
			lastName: member.user.lastName || undefined,
			username: member.user.username || '',
			roleId: member.role?.id || undefined,
			roleName: member.role?.name || undefined
		}
	}

	/**
	 * Форматирует промпт с данными
	 */
	static formatPrompt(
		basePrompt: string,
		author: GeminiUser,
		roles: GeminiRole[],
		tasks: GeminiTask[],
		members: GeminiChatMember[]
	): string {
		const currentTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
		
		let prompt = basePrompt
			.replace('{currentTime}', currentTime)
			.replace('{author}', JSON.stringify(author, null, 2))
			.replace('{roles}', JSON.stringify(roles, null, 2))
			.replace('{tasks}', JSON.stringify(tasks, null, 2))
			.replace('{chatMembers}', JSON.stringify(members, null, 2))

		return prompt
	}
}

/**
 * Основной форматтер сообщений
 */
export class MessageFormatter {
	// Константы для сообщений
	static readonly BOT_MESSAGES = {
		SERVER_WORKING: '🚀 Сервер работает!',
		WELCOME: (user: UserEntity) => `${user.firstName}, вы были автоматически зарегистрированы в Track-It!`,
		HELP: `🤖 <b>Track-It Bot</b> - ваш помощник по управлению задачами

<b>Основные команды:</b>
/start - Начать работу с ботом
/help - Показать эту справку
/tasks - Показать все задачи
/roles - Показать все роли
/members - Показать участников чата
/check - Обработать сообщение (ответ на голос/текст)

<b>Способы создания задач:</b>
🎤 Голосовое сообщение (в группах - с упоминанием бота)
📝 Текстовое сообщение (в группах - с упоминанием бота)
💬 В личных чатах - любой текст или голос

<b>Примеры:</b>
• "Создать задачу написать код до завтра"
• "Назначить задачу 1 на Петю"
• "Отметить задачу 2 как выполненную"
• "check" - обработать предыдущее сообщение`,
		UNKNOWN_COMMAND: '❓ Неизвестная команда. Используйте /help для справки.',
		NO_TASKS: '📝 Задач пока нет',
		NO_ROLES: '🎭 Ролей пока нет',
		NO_MEMBERS: '👥 Участников пока нет',
		SYSTEM_MESSAGE: '🤖 Системное сообщение',
		VOICE_NOT_FOUND: '🎤 Голосовое сообщение не найдено',
		VOICE_INSTRUCTIONS: '🎤 Отправьте голосовое сообщение с описанием задачи',
		NATURAL_SPEECH: '🗣️ Говорите естественно, как обычно',
		ADMIN_OK: '✅ Админ права подтверждены',
		ADMIN_NEED: '⚠️ Нужны права администратора',
		REGISTER_BUTTON: '📝 Зарегистрироваться',
		PINNED: '📌 Сообщение закреплено',
		ADMIN_WELCOME_PINNED: '👋 Приветственное сообщение закреплено',
		ADMIN_THANKS: '🙏 Спасибо за настройку!',
		ADMIN_FULL: '🎉 Бот полностью настроен!'
	} as const

	static readonly ERRORS = {
		GENERAL: '❌ Произошла ошибка. Попробуйте еще раз.',
		NOT_FOUND: '❓ Не найдено',
		INVALID_INPUT: '⚠️ Некорректные данные',
		PERMISSION_DENIED: '🚫 Недостаточно прав',
		BOT_NOT_INITIALIZED: '🤖 Бот не инициализирован',
		UNAVAILABLE: '🚫 Сервис временно недоступен'
	} as const

	static readonly VARIANTS = {
		UNKNOWN: 'Неизвестно',
		NOT_SPECIFIED: 'Не указано',
		NO_DEADLINE: 'Без дедлайна'
	} as const

	static readonly SUCCESS = '✅ Операция выполнена успешно'

	/**
	 * Получает правильную форму слова "участник" в зависимости от количества
	 */
	static getMemberPlural(count: number): string {
		if (count === 1) return 'участник'
		if (count >= 2 && count <= 4) return 'участника'
		return 'участников'
	}

	/**
	 * Форматирует время в читаемом виде
	 */
	static formatTime(date: Date): string {
		return date.toLocaleString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	/**
	 * Создает заголовок с эмодзи
	 */
	static createHeader(emoji: string, text: string): string {
		return `${emoji} <b>${text}</b>`
	}

	/**
	 * Создает разделитель
	 */
	static createSeparator(): string {
		return '─'.repeat(20)
	}
}
