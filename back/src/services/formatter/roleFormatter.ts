import { RoleEntity } from '../../entities/Role'
import { UserFormatter } from './userFormatter'
import { MessageFormatter } from './messageFormatter'

/**
 * Форматтер для работы с ролями
 * Отвечает только за форматирование информации о ролях
 */
export class RoleFormatter {
	/**
	 * Форматирует информацию о роли для отображения в списках
	 * Используется в списках ролей группы
	 */
	static formatRole(role: RoleEntity): string {
		const memberCount = role.members?.length || 0
		const memberText = MessageFormatter.getMemberPlural(memberCount)
		
		return `🎭 <b>${role.name}</b>\n👥 ${memberCount} ${memberText}`
	}

	/**
	 * Форматирует краткую информацию о роли
	 * Используется в компактных списках
	 */
	static formatRoleShort(role: RoleEntity): string {
		const memberCount = role.members?.length || 0
		return `🎭 ${role.name} (${memberCount})`
	}

	/**
	 * Форматирует детальную информацию о роли с участниками
	 * Используется при просмотре конкретной роли
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
	 * Используется при создании ролей через голосовые команды
	 */
	static formatNewRole(role: RoleEntity): string {
		return `✨ <b>Создана новая роль!</b>\n🎭 ${role.name}`
	}

	/**
	 * Форматирует информацию о переименовании роли
	 * Используется при обновлении названия роли
	 */
	static formatRenamedRole(oldName: string, newName: string): string {
		return `🔄 <b>Роль переименована</b>\n🎭 "${oldName}" → "${newName}"`
	}

	/**
	 * Форматирует информацию о назначении роли пользователю
	 * Используется при назначении ролей
	 */
	static formatRoleAssigned(role: RoleEntity, user: any): string {
		return `👤 <b>Роль назначена</b>\n🎭 ${role.name}\n👤 ${UserFormatter.createDisplayName(user)}`
	}

	/**
	 * Форматирует информацию о снятии роли с пользователя
	 * Используется при снятии ролей
	 */
	static formatRoleUnassigned(role: RoleEntity, user: any): string {
		return `👤 <b>Роль снята</b>\n🎭 ${role.name}\n👤 ${UserFormatter.createDisplayName(user)}`
	}

	/**
	 * Форматирует информацию об удалении роли
	 * Используется при удалении ролей
	 */
	static formatRoleDeleted(role: RoleEntity): string {
		return `🗑️ <b>Роль удалена</b>\n🎭 ${role.name}`
	}
}
