import { UserEntity } from '../../entities/User'
import { MessageFormatter } from './messageFormatter'

/**
 * Форматтер для работы с пользователями
 * Отвечает только за форматирование информации о пользователях
 */
export class UserFormatter {
	/**
	 * Создает простой тег пользователя для упоминаний
	 * Используется в inline-упоминаниях и быстрых ссылках
	 */
	static createTag(user: UserEntity | undefined): string {
		if (!user) {
			return MessageFormatter.ERRORS.NOT_FOUND
		}
		return `@${user.username || user.firstName || 'unknown'}`
	}

	/**
	 * Создает красивое отображаемое имя пользователя с эмодзи
	 * Используется в списках и детальной информации
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
	 * Используется в списках участников
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
	 * Используется в профилях и детальных просмотрах
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
