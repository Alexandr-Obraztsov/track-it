import TelegramBot = require('node-telegram-bot-api')
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { UserService } from './userService'

// Сервис для обработки callback query
export class CallbackHandlerService {
	private taskService: TaskService
	private chatService: ChatService
	private userService: UserService

	constructor(taskService: TaskService, chatService: ChatService, userService: UserService) {
		this.taskService = taskService
		this.chatService = chatService
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
			}

			// Подтверждаем callback
			bot.answerCallbackQuery(callbackQuery.id)
		} catch (error) {
			console.error('Ошибка обработки callback:', error)
			bot.answerCallbackQuery(callbackQuery.id, { text: 'Произошла ошибка' })
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
				text: 'В личных сообщениях регистрация не требуется! Просто отправьте голосовое сообщение.',
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
				text: '✅ Регистрация происходит автоматически! Просто отправьте сообщение в чат',
				show_alert: true,
			})
		}
	}
}
