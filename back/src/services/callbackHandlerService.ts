import TelegramBot = require('node-telegram-bot-api')
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'
import { UserService } from './userService'
import { MessageFormatter, ListFormatter } from './formatter'

// Сервис для обработки callback query
export class CallbackHandlerService {
	private taskService: TaskService
	private chatService: ChatService
	private roleService: RoleService
	private userService: UserService

	constructor(taskService: TaskService, chatService: ChatService, roleService: RoleService, userService: UserService) {
		this.taskService = taskService
		this.chatService = chatService
		this.roleService = roleService
		this.userService = userService
	}

	// Обработка callback query
	async handleCallbackQuery(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery): Promise<void> {
		const data = callbackQuery.data
		const msg = callbackQuery.message
		const user = callbackQuery.from

		if (!data || !msg) return

		try {
			if (data === 'register') {
				await this.handleRegisterCallback(bot, callbackQuery, msg, user)
			} else if (data === 'show_tasks') {
				await this.handleShowTasksCallback(bot, callbackQuery, msg, user)
			} else if (data === 'show_members') {
				await this.handleShowMembersCallback(bot, callbackQuery, msg, user)
			} else if (data === 'show_roles') {
				await this.handleShowRolesCallback(bot, callbackQuery, msg, user)
			}

			// Подтверждаем callback
			bot.answerCallbackQuery(callbackQuery.id)
		} catch (error) {
			console.error('Ошибка обработки callback:', error)
			bot.answerCallbackQuery(callbackQuery.id, { text: MessageFormatter.ERRORS.GENERAL })
		}
	}

	// Обработка callback регистрации (информационная, так как регистрация автоматическая)
	private async handleRegisterCallback(
		bot: TelegramBot,
		callbackQuery: TelegramBot.CallbackQuery,
		msg: TelegramBot.Message,
		user: TelegramBot.User
	): Promise<void> {
		const chatId = msg.chat.id.toString()
		const userId = user.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup) {
			bot.answerCallbackQuery(callbackQuery.id, {
				text: MessageFormatter.INFO.PRIVATE_OK,
			})
			return
		}

		try {
			// Проверяем, зарегистрирован ли уже пользователь
			const existingMember = await this.chatService.isMember(chatId, userId)
			if (existingMember) {
				bot.answerCallbackQuery(callbackQuery.id, {
					text: `✅ ${user.first_name || user.username}, вы уже зарегистрированы!\n\n🎙️ Отправьте голосовое сообщение для управления задачами.`,
					show_alert: true,
				})
				return
			}

			// Автоматически регистрируем пользователя
			const member = await this.userService.createOrGetUser({
				telegramId: userId,
				username: user.username || '',
				firstName: user.first_name || '',
				lastName: user.last_name || '',
			})

			await this.chatService.addMember(chatId, userId)

			bot.answerCallbackQuery(callbackQuery.id, {
				text: `✅ ${member.firstName || member.username} зарегистрирован!`,
				show_alert: true,
			})
		} catch (error) {
			console.error('Ошибка регистрации через callback:', error)
			bot.answerCallbackQuery(callbackQuery.id, {
				text: MessageFormatter.SUCCESS.REGISTERED,
				show_alert: true,
			})
		}
	}

	// Обработка callback показа задач
	private async handleShowTasksCallback(
		bot: TelegramBot,
		callbackQuery: TelegramBot.CallbackQuery,
		msg: TelegramBot.Message,
		user: TelegramBot.User
	): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup) return

		try {
			const tasks = await this.taskService.getGroupTasks(chatId)
			const response = ListFormatter.formatTasksList(tasks)
			bot.sendMessage(chatId, response, { parse_mode: 'HTML' })
		} catch (error) {
			console.error('Ошибка получения списка задач:', error)
			bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}

	// Обработка callback показа участников
	private async handleShowMembersCallback(
		bot: TelegramBot,
		callbackQuery: TelegramBot.CallbackQuery,
		msg: TelegramBot.Message,
		user: TelegramBot.User
	): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup) return

		try {
			const members = await this.chatService.getChatMembers(chatId)
			const response = ListFormatter.formatMembersList(members)
			bot.sendMessage(chatId, response, { parse_mode: 'HTML' })
		} catch (error) {
			console.error('Ошибка получения списка участников:', error)
			bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}

	// Обработка callback показа ролей
	private async handleShowRolesCallback(
		bot: TelegramBot,
		callbackQuery: TelegramBot.CallbackQuery,
		msg: TelegramBot.Message,
		user: TelegramBot.User
	): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup) return

		try {
			const roles = await this.roleService.getChatRoles(chatId)
			const response = ListFormatter.formatRolesList(roles)
			bot.sendMessage(chatId, response, { parse_mode: 'HTML' })
		} catch (error) {
			console.error('Ошибка получения списка ролей:', error)
			bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}
}
