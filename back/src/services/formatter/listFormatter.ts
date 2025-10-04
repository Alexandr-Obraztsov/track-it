import { TaskEntity } from '../../entities/Task'
import { ChatMemberEntity } from '../../entities/ChatMember'
import { RoleEntity } from '../../entities/Role'
import { Role } from '../../types'
import { UserFormatter } from './userFormatter'
import { TaskFormatter } from './taskFormatter'
import { RoleFormatter } from './roleFormatter'
import { MessageFormatter } from './messageFormatter'

/**
 * Форматтер для работы со списками
 * Отвечает только за форматирование списков различных сущностей
 */
export class ListFormatter {
	/**
	 * Форматирует список задач
	 * Используется для отображения списков задач в группах и личных чатах
	 */
	static formatTasksList(tasks: TaskEntity[]): string {
		if (tasks.length === 0) {
			return '📋 <b>Задач пока нет</b>\n\nСоздайте первую задачу голосовым сообщением!'
		}

		let response = `📋 <b>Список задач (${tasks.length})</b>\n\n`
		tasks.forEach((task, index) => {
			response += `${index + 1}. ${TaskFormatter.formatTask(task)}\n\n`
		})
		return response.trim()
	}

	/**
	 * Форматирует список участников группы
	 * Используется для отображения участников чата
	 */
	static formatMembersList(members: ChatMemberEntity[]): string {
		if (members.length === 0) {
			return '👥 <b>Участники группы отсутствуют</b>'
		}

		let response = `👥 <b>Участники группы (${members.length})</b>\n\n`
		members.forEach((member, index) => {
			const userInfo = UserFormatter.createShortInfo(member.user)
			const roleInfo = member.role ? ` - ${member.role.name}` : ` - ${MessageFormatter.VARIANTS.NO_ROLE}`
			response += `${index + 1}. ${userInfo}${roleInfo}\n`
		})
		return response.trim()
	}

	/**
	 * Форматирует список ролей
	 * Используется для отображения ролей в группе
	 */
	static formatRolesList(roles: RoleEntity[]): string {
		if (roles.length === 0) {
			return '🎭 <b>Роли в группе отсутствуют</b>\n\nСоздайте первую роль голосовым сообщением!'
		}

		let response = `🎭 <b>Роли в группе (${roles.length})</b>\n\n`
		roles.forEach((role, index) => {
			response += `${index + 1}. ${RoleFormatter.formatRoleShort(role)}\n`
		})
		return response.trim()
	}

	/**
	 * Форматирует список ролей из типизированных объектов
	 * Используется для отображения ролей из API ответов
	 */
	static formatTypedRolesList(roles: Role[]): string {
		if (roles.length === 0) {
			return '🎭 <b>Роли в группе отсутствуют</b>'
		}

		let response = `🎭 <b>Роли в группе (${roles.length})</b>\n\n`
		roles.forEach((role, index) => {
			response += `${index + 1}. 🎭 ${role.name}\n`
		})
		return response.trim()
	}

	/**
	 * Форматирует список задач, назначенных конкретному пользователю
	 * Используется для отображения персональных задач
	 */
	static formatUserTasksList(tasks: TaskEntity[], userId: string): string {
		if (tasks.length === 0) {
			return '📋 <b>На вас не назначено задач</b>'
		}

		let response = `📋 <b>Ваши задачи (${tasks.length})</b>\n\n`
		tasks.forEach((task, index) => {
			response += `${index + 1}. ${TaskFormatter.formatTask(task)}\n\n`
		})
		return response.trim()
	}


	/**
	 * Форматирует список участников роли
	 * Используется для отображения участников конкретной роли
	 */
	static formatRoleMembersList(role: RoleEntity): string {
		if (!role.members || role.members.length === 0) {
			return `🎭 <b>${role.name}</b>\n👥 Участники отсутствуют`
		}

		let response = `🎭 <b>${role.name}</b>\n👥 Участники (${role.members.length}):\n\n`
		role.members.forEach((member, index) => {
			const userInfo = UserFormatter.createShortInfo(member.user)
			response += `${index + 1}. ${userInfo}\n`
		})
		return response.trim()
	}
}
