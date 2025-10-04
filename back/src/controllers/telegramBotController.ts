import TelegramBot from 'node-telegram-bot-api'
import { GeminiService } from '../services/geminiService'
import { TaskService } from '../services/taskService'
import { ChatService } from '../services/chatService'
import { RoleService } from '../services/roleService'
import { CommandHandlerService } from '../services/commandHandlerService'
import { CallbackHandlerService } from '../services/callbackHandlerService'
import { UserService } from '../services/userService'
import { UserFormatter, MessageFormatter } from '../services/formatter'
import { BotMentionUtils } from '../utils/botMentionUtils'
import { ContextService } from '../services/contextService'
import { MessageProcessor } from '../services/messageProcessor'

// Контроллер для Telegram бота
class TelegramBotController {
	private bot?: TelegramBot
	private token: string
	private taskService: TaskService
	private chatService: ChatService
	private roleService: RoleService
	private commandHandler: CommandHandlerService
	private callbackHandler: CallbackHandlerService
	private messageProcessor: MessageProcessor
	private geminiService: GeminiService
	private userService: UserService

	constructor(
		taskService: TaskService,
		chatService: ChatService,
		roleService: RoleService,
		geminiService: GeminiService,
		userService: UserService
	) {
		this.taskService = taskService
		this.chatService = chatService
		this.roleService = roleService
		this.geminiService = geminiService
		this.userService = userService

		// Инициализируем сервисы обработки
		const contextService = new ContextService(taskService, chatService, roleService, userService)
		this.messageProcessor = new MessageProcessor(contextService, geminiService, taskService)
		this.commandHandler = new CommandHandlerService(taskService, chatService, roleService, userService)
		this.callbackHandler = new CallbackHandlerService(taskService, chatService, roleService, userService)

		this.token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN'
		if (this.token === 'YOUR_BOT_TOKEN') {
			console.error('Ошибка: TELEGRAM_BOT_TOKEN не установлен. Установите токен бота в переменные окружения.')
			return
		}

		// Настройка бота
		const botOptions: any = {
			polling: true,
			request: {
				timeout: 30000, // 30 секунд таймаут
			},
		}

		this.bot = new TelegramBot(this.token, botOptions)
		this.initializeHandlers()
		this.initializeErrorHandling()
		console.log('Бот инициализирован успешно')
	}

	private initializeHandlers(): void {
		if (!this.bot) return

		// Обработка callback query
		this.bot.on('callback_query', async callbackQuery => {
			try {
				await this.callbackHandler.handleCallbackQuery(this.bot!, callbackQuery)
			} catch (error) {
				console.error('Ошибка в callback query:', error)
			}
		})

		// Обработка команды /start
		this.bot.onText(/\/start/, async msg => {
			try {
				await this.commandHandler.handleStart(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в команде /start:', error)
			}
		})

		// Обработка команды /check
		this.bot.onText(/\/check/, async msg => {
			try {
				await this.handleCheckCommand(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в обработке сообщения:', error)
			}
		})

		// Обработка команды /tasks
		this.bot.onText(/\/tasks/, async msg => {
			try {
				await this.commandHandler.handleTasks(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в команде /tasks:', error)
			}
		})

		// Обработка команды /members
		this.bot.onText(/\/members/, async msg => {
			try {
				await this.commandHandler.handleMembers(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в команде /members:', error)
			}
		})

		// Обработка команды /roles
		this.bot.onText(/\/roles/, async msg => {
			try {
				await this.commandHandler.handleRoles(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в команде /roles:', error)
			}
		})

		// Обработка команды /mytasks
		this.bot.onText(/\/mytasks/, async msg => {
			try {
				await this.commandHandler.handleMyTasks(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в команде /mytasks:', error)
			}
		})

		// Обработка голосовых сообщений
		this.bot.on('voice', async msg => {
			try {
				const isMentioned = await BotMentionUtils.isBotMentioned(this.bot!, msg)
				if (!isMentioned) return

				await this.messageProcessor.handleMessage(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в обработке голосового сообщения:', error)
			}
		})

		// Обработка текстовых сообщений (не команд)
		this.bot.on('message', async msg => {
			try {
				// Пропускаем команды, голосовые сообщения и другие типы
				if (msg.text?.startsWith('/') || msg.voice || !msg.text) return
				
				// Проверяем, упомянут ли бот в групповом чате
				const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
				if (isGroup) {
					const isMentioned = await BotMentionUtils.isBotMentioned(this.bot!, msg)
					if (!isMentioned) return
				}

				await this.messageProcessor.handleMessage(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в обработке текстового сообщения:', error)
			}
		})

		// Обработка новых участников группы
		this.bot.on('new_chat_members', async msg => {
			try {
				await this.handleNewChatMembers(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в приветствии новых участников:', error)
			}
		})

		// Обработка добавления бота в группу
		this.bot.on('my_chat_member', async msg => {
			try {
				await this.handleMyChatMember(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка при обработке изменения статуса бота:', error)
			}
		})

		// Обработка любых сообщений для логирования и автоматической регистрации
		this.bot.on('message', async msg => {
			try {
				await this.handleMessage(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в обработке сообщения:', error)
			}
		})
	}

	private initializeErrorHandling(): void {
		if (!this.bot) return

		this.bot.on('polling_error', error => {
			console.error('Polling error:', error)
		})

		this.bot.on('error', error => {
			console.error('Bot error:', error)
		})
	}

	// Обработка новых участников группы
	private async handleNewChatMembers(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const user = msg.from
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup || !user) return

		try {
			// Создаем или получаем чат
			await this.chatService.createOrGetChat({
				telegramId: chatId,
				title: msg.chat.title || 'Unknown Group',
				username: msg.chat.username,
			})

			if (user.is_bot) return // Игнорируем ботов

			// Регистрируем нового участника
			const member = await this.userService.createOrGetUser({
				telegramId: user.id.toString(),
				username: user.username!,
				firstName: user.first_name,
				lastName: user.last_name,
			})

			// Автоматически регистрируем нового участника
			await this.chatService.addMember(chatId, member.telegramId.toString())

			const personalWelcome = MessageFormatter.BOT_MESSAGES.WELCOME(member)

			bot.sendMessage(chatId, personalWelcome)
		} catch (error) {
			console.error('Ошибка при приветствии новых участников:', error)
		}
	}

	// Обработка всех сообщений для автоматической регистрации и логирования
	private async handleMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chat = msg.chat
		const user = msg.from
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
		const messageText = msg.text || msg.caption || MessageFormatter.BOT_MESSAGES.SYSTEM_MESSAGE

		try {
			const isMentioned = await BotMentionUtils.isBotMentioned(this.bot!, msg)
			// Если бот упомянут и сообщение является ответом на голосовое сообщение
			if (isMentioned && msg.reply_to_message && msg.reply_to_message.voice)
				await this.messageProcessor.handleMessage(this.bot!, msg.reply_to_message)
		} catch (error) {
			console.error('Ошибка в обработке сообщения:', error)
		}

		// Обработка кнопок клавиатуры в личных чатах
		if (!isGroup && user && !user.is_bot && msg.text) {
			const buttonTexts = ['📋 Мои задачи']
			if (buttonTexts.includes(msg.text)) {
				try {
					await this.commandHandler.handleKeyboardButton(this.bot!, msg)
					return // Не продолжаем обработку, если это кнопка клавиатуры
				} catch (error) {
					console.error('Ошибка обработки кнопки клавиатуры:', error)
				}
			}
		}

		// Обработка текстовых сообщений для создания задач
		if (user && !user.is_bot && msg.text && !msg.text.startsWith('/')) {
			const isMentioned = await BotMentionUtils.isBotMentioned(this.bot!, msg)
			if (isMentioned || !isGroup) {
				try {
					await this.messageProcessor.handleMessage(this.bot!, msg)
					return // Не продолжаем обработку, если это текстовое сообщение для создания задач
				} catch (error) {
					console.error('Ошибка обработки текстового сообщения:', error)
				}
			}
		}

		// Автоматическая регистрация в групповых чатах
		if (isGroup && user && !user.is_bot) {
			console.log(`Received message: ${messageText} from ${user?.username!}`)
			try {
				// Создаем или получаем чат
				await this.chatService.createOrGetChat({
					telegramId: chat.id.toString(),
					title: chat.title || 'Unknown Group',
					username: chat.username,
				})

				// Проверяем, зарегистрирован ли пользователь
				const isRegistered = await this.chatService.isMember(chat.id.toString(), user.id.toString())

				if (!isRegistered) {
					const member = await this.userService.createOrGetUser({
						telegramId: user.id.toString(),
						username: user.username!,
						firstName: user.first_name || '',
						lastName: user.last_name || '',
					})

					// Автоматически регистрируем пользователя
					await this.chatService.addMember(chat.id.toString(), user.id.toString())

					const userTag = UserFormatter.createTag(member)
					const welcomeText = MessageFormatter.BOT_MESSAGES.WELCOME(member)

					// Отправляем уведомление, которое самоудалится через 5 секунд
					const sentMessage = await bot.sendMessage(chat.id.toString(), welcomeText)

					setTimeout(async () => {
						try {
							await bot.deleteMessage(chat.id.toString(), sentMessage.message_id)
						} catch (deleteError) {
							console.warn('Не удалось удалить уведомление о регистрации:', deleteError)
						}
					}, 5000)
				}
			} catch (error) {
				console.error('Ошибка автоматической регистрации:', error)
			}
		}
	}

	private async handleCheckCommand(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		if (msg.reply_to_message && (msg.reply_to_message.voice || msg.reply_to_message.text)) {
			await this.messageProcessor.handleMessage(this.bot!, msg.reply_to_message)
		} else {
			this.bot!.sendMessage(msg.chat.id, '❓ Ответьте на голосовое или текстовое сообщение командой /check', {
				reply_to_message_id: msg.message_id,
			})
		}
	}
	// Обработка изменения статуса бота в чате (добавление/удаление)
	private async handleMyChatMember(bot: TelegramBot, msg: TelegramBot.ChatMemberUpdated): Promise<void> {
		const chat = msg.chat
		const isGroup = chat.type === 'group' || chat.type === 'supergroup'
		const newStatus = msg.new_chat_member?.status
		const oldStatus = msg.old_chat_member?.status

		if (!isGroup) return

		try {
			// Если бот был добавлен в группу (стал участником)
			if (newStatus === 'member' && (oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus)) {
				await this.handleBotAddedToGroup(bot, msg, false)
			}
			// Если бот стал администратором
			else if (newStatus === 'administrator' && oldStatus === 'member') {
				await this.handleBotBecameAdmin(bot, msg)
			}
			// Если бот был добавлен сразу как администратор
			else if (newStatus === 'administrator' && (oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus)) {
				await this.handleBotAddedToGroup(bot, msg, true)
			}
		} catch (error) {
			console.error('Ошибка при обработке изменения статуса бота:', error)
		}
	}

	// Обработка добавления бота в группу
	private async handleBotAddedToGroup(
		bot: TelegramBot,
		msg: TelegramBot.ChatMemberUpdated,
		isAdmin: boolean
	): Promise<void> {
		const chat = msg.chat

		// Создаем или получаем чат
		await this.chatService.createOrGetChat({
			telegramId: chat.id.toString(),
			title: chat.title || 'Unknown Group',
			username: chat.username || '',
		})

		// Отправляем приветственное сообщение
		const welcomeMessage =
			MessageFormatter.BOT_MESSAGES.WELCOME + '\n\n' +
			MessageFormatter.BOT_MESSAGES.VOICE_INSTRUCTIONS + '\n\n' +
			MessageFormatter.BOT_MESSAGES.NATURAL_SPEECH + '\n\n' +
			(isAdmin
				? MessageFormatter.BOT_MESSAGES.ADMIN_OK
				: MessageFormatter.BOT_MESSAGES.ADMIN_NEED)

		// Создаем inline клавиатуру с полезными кнопками
		const keyboard = {
			inline_keyboard: [
				[
					{
						text: MessageFormatter.BOT_MESSAGES.REGISTER_BUTTON,
						callback_data: 'register',
					},
				],
				[
					{ text: '📋 Задачи', callback_data: 'show_tasks' },
					{ text: '👥 Участники', callback_data: 'show_members' },
					{ text: '🎭 Роли', callback_data: 'show_roles' }
				]
			],
		}

		const sentMessage = await bot.sendMessage(chat.id.toString(), welcomeMessage, {
			reply_markup: keyboard,
		})

		if (isAdmin) {
			// Если бот уже админ, сразу закрепляем сообщение
			try {
				await bot.pinChatMessage(chat.id.toString(), sentMessage.message_id)
				await this.chatService.updateWelcomeMessage(chat.id.toString(), sentMessage.message_id)
				bot.sendMessage(chat.id.toString(), MessageFormatter.BOT_MESSAGES.PINNED)
			} catch (error) {
				console.error('Ошибка закрепления сообщения:', error)
			}
		} else {
			// Сохраняем ID сообщения для последующего закрепления
			await this.chatService.updateWelcomeMessage(chat.id.toString(), sentMessage.message_id)
		}
	}

	// Обработка получения прав администратора
	private async handleBotBecameAdmin(bot: TelegramBot, msg: TelegramBot.ChatMemberUpdated): Promise<void> {
		const chatId = msg.chat.id.toString()

		try {
			// Получаем ID приветственного сообщения
			const welcomeMessageId = await this.chatService.getWelcomeMessageId(chatId)

			if (welcomeMessageId) {
				// Закрепляем приветственное сообщение
				await bot.pinChatMessage(chatId, welcomeMessageId)
				bot.sendMessage(
					chatId,
					MessageFormatter.BOT_MESSAGES.ADMIN_WELCOME_PINNED
				)
			} else {
				// Если нет сохраненного сообщения, отправляем новое
				bot.sendMessage(
					chatId,
					MessageFormatter.BOT_MESSAGES.ADMIN_THANKS + ' ' + MessageFormatter.BOT_MESSAGES.ADMIN_FULL
				)
			}
		} catch (error) {
			console.error('Ошибка при обработке получения прав администратора:', error)
			bot.sendMessage(chatId, MessageFormatter.BOT_MESSAGES.ADMIN_THANKS)
		}
	}

	public sendMessage(chatId: string | number, text: string): void {
		if (!this.bot) {
			console.error('Bot is not initialized')
			return
		}
		this.bot.sendMessage(chatId, text)
	}

	public getBot(): TelegramBot | undefined {
		return this.bot
	}
}

// Экспортируем класс для инициализации с сервисами
export { TelegramBotController }
