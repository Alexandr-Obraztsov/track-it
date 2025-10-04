import TelegramBot from 'node-telegram-bot-api'
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'
import { UserService } from './userService'
import { GeminiUser, GeminiRole, GeminiTask, GeminiChatMember } from '../types'
import { MessageFormatter } from './formatter'

/**
 * Сервис для получения контекста (роли, задачи, участники) для обработки сообщений
 * 
 * @description Централизованный сервис для получения всех необходимых данных
 * для обработки сообщений в групповых и личных чатах. Обеспечивает существование
 * пользователей и чатов, получает роли, задачи и участников.
 * 
 * @example
 * ```typescript
 * const contextService = new ContextService(taskService, chatService, roleService, userService)
 * const context = await contextService.getContext(message)
 * ```
 */
export class ContextService {
	private taskService: TaskService
	private chatService: ChatService
	private roleService: RoleService
	private userService: UserService

	/**
	 * Создает экземпляр ContextService
	 * 
	 * @param taskService - Сервис для работы с задачами
	 * @param chatService - Сервис для работы с чатами
	 * @param roleService - Сервис для работы с ролями
	 * @param userService - Сервис для работы с пользователями
	 */
	constructor(taskService: TaskService, chatService: ChatService, roleService: RoleService, userService: UserService) {
		this.taskService = taskService
		this.chatService = chatService
		this.roleService = roleService
		this.userService = userService
	}

	/**
	 * Получает полный контекст для обработки сообщения
	 * 
	 * @description Извлекает все необходимые данные для обработки сообщения:
	 * информацию об авторе, роли, задачи и участников чата.
	 * Автоматически определяет тип чата (группа/личный) и получает соответствующие данные.
	 * 
	 * @param msg - Telegram сообщение
	 * @returns Объект с контекстом для обработки
	 * 
	 * @example
	 * ```typescript
	 * const context = await contextService.getContext(message)
	 * console.log(context.author) // Информация об авторе
	 * console.log(context.tasks) // Список задач
	 * ```
	 */
	async getContext(msg: TelegramBot.Message): Promise<{
		author: GeminiUser
		roles: GeminiRole[]
		tasks: GeminiTask[]
		members: GeminiChatMember[]
		isGroup: boolean
	}> {
		const chatId = msg.chat.id.toString()
		const userId = msg.from!.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		// Создаем объект автора запроса
		const author: GeminiUser = {
			telegramId: userId,
			username: msg.from?.username || userId,
			firstName: msg.from?.first_name || MessageFormatter.VARIANTS.UNKNOWN,
			lastName: msg.from?.last_name,
		}

		let roles: GeminiRole[] = []
		let tasks: GeminiTask[] = []
		let members: GeminiChatMember[] = []

		if (isGroup) {
			await this.ensureGroupContext(chatId, userId, msg)
			const groupContext = await this.getGroupContext(chatId)
			roles = groupContext.roles
			tasks = groupContext.tasks
			members = groupContext.members
		} else {
			await this.ensurePersonalContext(userId, msg)
			const personalContext = await this.getPersonalContext(userId)
			tasks = personalContext.tasks
			members = personalContext.members
		}

		return {
			author,
			roles,
			tasks,
			members,
			isGroup
		}
	}

	/**
	 * Обеспечивает существование пользователя и чата в группе
	 */
	private async ensureGroupContext(chatId: string, userId: string, msg: TelegramBot.Message): Promise<void> {
		try {
			// Обеспечиваем существование пользователя и чата
			await this.userService.createOrGetUser({
				telegramId: userId,
				firstName: msg.from?.first_name || MessageFormatter.VARIANTS.UNKNOWN,
				lastName: msg.from?.last_name,
				username: msg.from?.username || userId,
			})

			await this.chatService.createOrGetChat({
				telegramId: chatId,
				title: msg.chat.title || MessageFormatter.ERRORS.NOT_FOUND,
				username: msg.chat.username,
			})
		} catch (error) {
			console.error('Ошибка обеспечения контекста группы:', error)
		}
	}

	/**
	 * Обеспечивает существование пользователя для личного чата
	 */
	private async ensurePersonalContext(userId: string, msg: TelegramBot.Message): Promise<void> {
		try {
			await this.userService.createOrGetUser({
				telegramId: userId,
				firstName: msg.from?.first_name || MessageFormatter.VARIANTS.UNKNOWN,
				lastName: msg.from?.last_name,
				username: msg.from?.username || userId,
			})
		} catch (error) {
			console.error('Ошибка обеспечения контекста пользователя:', error)
		}
	}

	/**
	 * Получает контекст группы (роли, задачи, участники)
	 */
	private async getGroupContext(chatId: string): Promise<{
		roles: GeminiRole[]
		tasks: GeminiTask[]
		members: GeminiChatMember[]
	}> {
		try {
			// Получаем всех участников с полной информацией
			const chatMembers = await this.chatService.getChatMembers(chatId)
			const members: GeminiChatMember[] = chatMembers.map(member => ({
				userId: member.userId,
				username: member.user?.username || '',
				firstName: member.user?.firstName || MessageFormatter.VARIANTS.UNKNOWN,
				lastName: member.user?.lastName,
				roleId: member.roleId,
				roleName: member.role?.name,
			}))

			// Получаем все роли с участниками
			const chatRoles = await this.roleService.getChatRoles(chatId)
			const roles: GeminiRole[] = chatRoles.map(role => ({
				id: role.id,
				name: role.name,
				chatId: role.chatId,
				memberIds: role.members?.map(m => m.userId) || [],
			}))

			// Получаем все задачи с полной информацией
			const groupTasks = await this.taskService.getGroupTasks(chatId)
			const tasks: GeminiTask[] = groupTasks.map(task => ({
				id: task.id,
				readableId: task.readableId,
				title: task.title,
				description: task.description,
				deadline: task.deadline ? String(task.deadline) : null,
				type: task.type,
				chatId: task.chatId,
				assignedUserId: task.assignedUserId,
				assignedRoleId: task.assignedRoleId,
				isCompleted: task.isCompleted,
			}))

			return { roles, tasks, members }
		} catch (error) {
			console.error('Ошибка получения контекста группы:', error)
			return { roles: [], tasks: [], members: [] }
		}
	}

	/**
	 * Получает контекст личного чата (задачи, участники)
	 */
	private async getPersonalContext(userId: string): Promise<{
		tasks: GeminiTask[]
		members: GeminiChatMember[]
	}> {
		try {
			// Получаем пользователя
			const user = await this.userService.createOrGetUser({
				telegramId: userId,
				firstName: 'Unknown',
				lastName: undefined,
				username: userId,
			})
			const members: GeminiChatMember[] = user ? [{
				userId: user.telegramId,
				username: user.username || '',
				firstName: user.firstName || MessageFormatter.VARIANTS.UNKNOWN,
				lastName: user.lastName,
				roleId: undefined,
				roleName: undefined,
			}] : []

			// Получаем личные задачи
			const personalTasks = await this.taskService.getPersonalTasks(userId)
			const tasks: GeminiTask[] = personalTasks.map(task => ({
				id: task.id,
				readableId: task.readableId,
				title: task.title,
				description: task.description,
				deadline: task.deadline ? String(task.deadline) : null,
				type: task.type,
				chatId: task.chatId,
				assignedUserId: task.assignedUserId,
				assignedRoleId: task.assignedRoleId,
				isCompleted: task.isCompleted,
			}))

			return { tasks, members }
		} catch (error) {
			console.error('Ошибка получения контекста пользователя:', error)
			return { tasks: [], members: [] }
		}
	}
}
