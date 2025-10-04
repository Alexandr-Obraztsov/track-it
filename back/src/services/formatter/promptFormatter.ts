import { GeminiUser, GeminiRole, GeminiTask, GeminiChatMember } from '../../types'
import { MessageFormatter } from './messageFormatter'

/**
 * Форматтер для подготовки данных для Gemini AI
 * 
 * @description Утилитарный класс для форматирования различных типов данных
 * в строки, подходящие для передачи в промпты Gemini AI. Обеспечивает
 * единообразное форматирование авторов, ролей, задач и участников.
 * 
 * @example
 * ```typescript
 * const authorString = PromptFormatter.formatAuthor(author)
 * const prompt = PromptFormatter.formatPrompt(basePrompt, author, roles, tasks, members)
 * ```
 */
export class PromptFormatter {
	/**
	 * Форматирует автора запроса для промпта
	 * 
	 * @param author - Объект с информацией об авторе
	 * @returns Отформатированная строка с информацией об авторе
	 */
	static formatAuthor(author: GeminiUser): string {
		return `ID: ${author.telegramId}, Имя: ${author.firstName} ${author.lastName || ''}, Username: @${author.username}`
	}

	/**
	 * Форматирует участников чата для промпта
	 * 
	 * @param members - Массив участников чата
	 * @returns Отформатированная строка с информацией об участниках
	 */
	static formatMembers(members: GeminiChatMember[]): string {
		return members.length > 0
			? members
					.map(
						m =>
							`ID: ${m.userId}, Имя: ${m.firstName} ${m.lastName || ''}, Username: @${m.username}, Роль: ${m.roleName || 'Без роли'}`
					)
					.join('\n')
			: MessageFormatter.GEMINI_DATA.USERS_ABSENT
	}

	/**
	 * Форматирует роли для промпта
	 */
	static formatRoles(roles: GeminiRole[]): string {
		return roles.length > 0
			? roles
					.map(
						r =>
							`ID: ${r.id}, Название: ${r.name}, Участников: ${r.memberIds.length}, ` +
							`Пользователи: ${r.memberIds.length > 0 ? r.memberIds.join(', ') : MessageFormatter.GEMINI_DATA.USERS_ABSENT}`
					)
					.join('\n')
			: MessageFormatter.GEMINI_DATA.ROLES_ABSENT
	}

	/**
	 * Форматирует задачи для промпта
	 */
	static formatTasks(tasks: GeminiTask[]): string {
		return tasks.length > 0
			? tasks
					.map(
						t =>
							`ID: ${t.id}, ReadableId: ${t.readableId}, Название: ${t.title}, Описание: ${t.description || 'отсутствует'}, ` +
							`Дедлайн: ${t.deadline || 'отсутствует'}, Назначена на пользователя: ${t.assignedUserId || 'отсутствует'}, ` +
							`Назначена на роль: ${t.assignedRoleId || 'отсутствует'}, Выполнена: ${t.isCompleted ? 'да' : 'нет'}`
					)
					.join('\n')
			: MessageFormatter.GEMINI_DATA.TASKS_ABSENT
	}

	/**
	 * Форматирует полный промпт для Gemini
	 */
	static formatPrompt(
		basePrompt: string,
		author: GeminiUser,
		roles: GeminiRole[],
		tasks: GeminiTask[],
		members: GeminiChatMember[],
		additionalText?: string
	): string {
		const currentTime = new Date().toString()
		
		let prompt = basePrompt
			.replace('{currentTime}', currentTime)
			.replace('{author}', this.formatAuthor(author))
			.replace('{roles}', this.formatRoles(roles))
			.replace('{tasks}', this.formatTasks(tasks))
			.replace('{chatMembers}', this.formatMembers(members))

		// Добавляем дополнительный текст если есть (для текстовых сообщений)
		if (additionalText) {
			prompt += `\n\nТЕКСТ СООБЩЕНИЯ ПОЛЬЗОВАТЕЛЯ: "${additionalText}"`
		}

		return prompt
	}
}
