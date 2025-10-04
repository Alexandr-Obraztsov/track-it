import TelegramBot = require('node-telegram-bot-api')
import { MessageFormatter, ListFormatter } from './formatter'
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'
import { UserService } from './userService'

// Сервис для обработки команд Telegram
export class CommandHandlerService {
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

	// Обработка команды /start
	async handleStart(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup) {
			// Создаем клавиатуру для личного чата
			const keyboard = {
				keyboard: [
					[
						{ text: '📋 Мои задачи' },
					]
				],
				resize_keyboard: true,
				one_time_keyboard: false
			}

			bot.sendMessage(
				chatId,
				MessageFormatter.BOT_MESSAGES.WELCOME + '\n\n🎙️ Отправьте голосовое сообщение для создания задач или используйте кнопки ниже:',
				{ reply_markup: keyboard }
			)
		}
	}

	// Обработка команды /tasks
	async handleTasks(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const userId = msg.from!.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		try {
			let tasks
			if (isGroup) {
				tasks = await this.taskService.getGroupTasks(chatId)
			} else {
				tasks = await this.taskService.getPersonalTasks(userId)
			}

			const response = ListFormatter.formatTasksList(tasks)
			bot.sendMessage(chatId, response, { parse_mode: 'HTML' })
		} catch (error) {
			console.error('Ошибка получения списка задач:', error)
			bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}

	// Обработка команды /members
	async handleMembers(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup) {
			bot.sendMessage(chatId, '⚠️ Эта команда работает только в группах')
			return
		}

		try {
			const members = await this.chatService.getChatMembers(chatId)
			const response = ListFormatter.formatChatMembersList(members)
			bot.sendMessage(chatId, response, { parse_mode: 'HTML' })
		} catch (error) {
			console.error('Ошибка получения списка участников:', error)
			bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}

	// Обработка команды /roles
	async handleRoles(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup) {
			bot.sendMessage(chatId, '⚠️ Эта команда работает только в группах')
			return
		}

		try {
			const roles = await this.roleService.getChatRoles(chatId)
			const response = ListFormatter.formatRolesList(roles)
			bot.sendMessage(chatId, response, { parse_mode: 'HTML' })
		} catch (error) {
			console.error('Ошибка получения списка ролей:', error)
			bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}

	// Обработка команды /mytasks
	async handleMyTasks(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const userId = msg.from!.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		try {
			let tasks
			if (isGroup) {
				tasks = await this.taskService.getAssignedTasks(userId, chatId)
			} else {
				tasks = await this.taskService.getPersonalTasks(userId)
			}

			const response = ListFormatter.formatTasksList(tasks)
			bot.sendMessage(chatId, response, { parse_mode: 'HTML' })
		} catch (error) {
			console.error('Ошибка получения персональных задач:', error)
			bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}

	// Обработка нажатий на кнопки клавиатуры
	async handleKeyboardButton(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const userId = msg.from!.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
		const buttonText = msg.text

		// Обрабатываем только в личных чатах
		if (isGroup) return

		try {
			switch (buttonText) {
				case '📋 Мои задачи':
					await this.handleMyTasks(bot, msg)
					break
				default:
					// Игнорируем неизвестные кнопки
					break
			}
		} catch (error) {
			console.error('Ошибка обработки кнопки клавиатуры:', error)
			bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}
}
