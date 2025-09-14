import TelegramBot from 'node-telegram-bot-api'
import { GeminiService } from '../services/geminiService'
import { TaskService } from '../services/taskService'
import { ChatService } from '../services/chatService'
import { RoleService } from '../services/roleService'
import { VoiceMessageProcessor } from '../services/voiceMessageProcessor'
import { CommandHandlerService } from '../services/commandHandlerService'
import { TextCommandService } from '../services/textCommandService'
import { CallbackHandlerService } from '../services/callbackHandlerService'
import { VoiceHandlerService } from '../services/voiceHandlerService'
import { dataSource } from '../server'

// Контроллер для Telegram бота
class TelegramBotController {
	private bot?: TelegramBot
	private token: string
	private geminiService?: GeminiService
	private taskService: TaskService
	private chatService: ChatService
	private roleService: RoleService
	private voiceProcessor: VoiceMessageProcessor
  private commandHandler!: CommandHandlerService
  private textCommandHandler!: TextCommandService
  private callbackHandler!: CallbackHandlerService
  private voiceHandler!: VoiceHandlerService

	constructor(taskService: TaskService, chatService: ChatService) {
		this.taskService = taskService
		this.chatService = chatService
		this.roleService = new RoleService(dataSource)
		
		// Инициализируем сервисы обработки
		this.commandHandler = new CommandHandlerService(taskService, chatService, this.roleService)
		this.textCommandHandler = new TextCommandService(taskService, chatService)
		this.callbackHandler = new CallbackHandlerService(taskService, chatService)
		this.voiceProcessor = new VoiceMessageProcessor(taskService, chatService, this.roleService)
		
		this.token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN'
		if (this.token === 'YOUR_BOT_TOKEN') {
			console.error(
				'Ошибка: TELEGRAM_BOT_TOKEN не установлен. Установите токен бота в переменные окружения.'
			)
			return
		}

		// Настройка бота
		const botOptions: any = {
			polling: true,
			request: {
				timeout: 30000, // 30 секунд таймаут
			},
		}

		const geminiApiKey = process.env.GEMINI_API_KEY || ''
		if (geminiApiKey) {
			this.geminiService = new GeminiService(geminiApiKey)
			// Обновляем voiceProcessor с geminiService
			this.voiceProcessor = new VoiceMessageProcessor(this.taskService, this.chatService, this.roleService, this.geminiService)
			// Инициализируем voiceHandler с geminiService
			this.voiceHandler = new VoiceHandlerService(this.taskService, this.chatService, this.roleService, this.geminiService)
		} else {
			console.error('GEMINI_API_KEY не установлен. Голосовые сообщения не будут обрабатываться.')
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

		// Обработка команды /help
		this.bot.onText(/\/help/, async msg => {
			try {
				await this.commandHandler.handleHelp(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в команде /help:', error)
			}
		})

		// Обработка команды /register
		this.bot.onText(/\/register/, async msg => {
			try {
				await this.commandHandler.handleRegister(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в команде /register:', error)
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

		// Обработка команды /pin_welcome
		this.bot.onText(/\/pin_welcome/, async msg => {
			try {
				await this.commandHandler.handlePinWelcome(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в команде /pin_welcome:', error)
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

		// Обработка команды /roles
		this.bot.onText(/\/roles/, async msg => {
			try {
				await this.commandHandler.handleRoles(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в команде /roles:', error)
			}
		})

		// Обработка команды /delete
		this.bot.onText(/\/delete (.+)/, async (msg, match) => {
			try {
				await this.textCommandHandler.handleDeleteTask(this.bot!, msg, match)
			} catch (error) {
				console.error('Ошибка в команде /delete:', error)
			}
		})

		// Обработка команды /assign
		this.bot.onText(/\/assign (.+)/, async (msg, match) => {
			try {
				await this.textCommandHandler.handleAssignTask(this.bot!, msg, match)
			} catch (error) {
				console.error('Ошибка в команде /assign:', error)
			}
		})

		// Обработка команды /complete
		this.bot.onText(/\/complete (.+)/, async (msg, match) => {
			try {
				await this.textCommandHandler.handleCompleteTask(this.bot!, msg, match)
			} catch (error) {
				console.error('Ошибка в команде /complete:', error)
			}
		})

		// Обработка команды назначения роли
		this.bot.onText(/\/role_assign (.+)/, async (msg, match) => {
			try {
				await this.commandHandler.handleRoleAssign(this.bot!, msg, match)
			} catch (error) {
				console.error('Ошибка в команде /role_assign:', error)
			}
		})

		// Обработка команды удаления роли
		this.bot.onText(/\/role_remove (.+)/, async (msg, match) => {
			try {
				await this.commandHandler.handleRoleRemove(this.bot!, msg, match)
			} catch (error) {
				console.error('Ошибка в команде /role_remove:', error)
			}
		})

		// Обработка голосовых сообщений
		this.bot.on('voice', async msg => {
			try {
				await this.voiceHandler.handleVoiceMessage(this.bot!, msg)
			} catch (error) {
				console.error('Ошибка в обработке голосового сообщения:', error)
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
	private async handleNewChatMembers(bot: TelegramBot, msg: any): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup || !msg.new_chat_members) return

		try {
			// Создаем или получаем чат
			await this.chatService.getOrCreateChat(
				chatId,
				msg.chat.title || 'Unknown Group',
				msg.chat.username
			)

			// Получаем ID закрепленного приветственного сообщения
			const welcomeMessageId = await this.chatService.getWelcomeMessageId(chatId)

			for (const newMember of msg.new_chat_members) {
				// Пропускаем ботов
				if (newMember.is_bot) continue

				// Автоматически регистрируем нового участника
				await this.chatService.registerMember(
					chatId,
					newMember.id.toString(),
					newMember.username || '',
					newMember.first_name || '',
					newMember.last_name || ''
				)

				const userTag = newMember.username ? `@${newMember.username}` : (newMember.first_name || 'Новый участник')

				if (welcomeMessageId) {
					// Если есть закрепленное приветственное сообщение, отправляем персональное приветствие
					const personalWelcome = `👋 Привет, ${userTag}! Добро пожаловать в группу!\n\n` +
						'✅ Вы автоматически зарегистрированы в системе.\n' +
						'📌 Обратите внимание на закрепленное сообщение с инструкциями.\n' +
						'🎙️ Отправьте голосовое сообщение для создания задач с помощью ИИ!'

					bot.sendMessage(chatId, personalWelcome)
				} else {
					// Если нет закрепленного сообщения, отправляем полное приветствие
					const fullWelcome = `👋 Привет, ${userTag}! Добро пожаловать в группу!\n\n` +
						'✅ Вы автоматически зарегистрированы в системе.\n\n' +
						'🤖 Я бот для управления задачами. Вот что я умею:\n\n' +
						' /tasks - Показать задачи\n' +
						'👥 /members - Список участников\n' +
						'🎭 /roles - Управление ролями\n' +
						'❓ /help - Подробная справка\n\n' +
						'🎙️ Отправьте голосовое сообщение для создания задач с помощью ИИ!'

					bot.sendMessage(chatId, fullWelcome)
				}
			}
		} catch (error) {
			console.error('Ошибка при приветствии новых участников:', error)
		}
	}

	// Обработка всех сообщений для автоматической регистрации и логирования
	private async handleMessage(bot: TelegramBot, msg: any): Promise<void> {
		const chatId = msg.chat.id.toString()
		const userId = msg.from?.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
		const messageText = msg.text || msg.caption || '[системное сообщение]'
		const username = msg.from?.username || msg.from?.first_name || 'unknown'
		
		console.log(`Received message: ${messageText} from ${username}`)

		// Автоматическая регистрация в групповых чатах
		if (isGroup && userId && msg.from && !msg.from.is_bot) {
			try {
				// Создаем или получаем чат
				await this.chatService.getOrCreateChat(
					chatId,
					msg.chat.title || 'Unknown Group',
					msg.chat.username
				)

				// Проверяем, зарегистрирован ли пользователь
				const isRegistered = await this.chatService.isMemberRegistered(chatId, userId)
				
				if (!isRegistered) {
					// Автоматически регистрируем пользователя
					await this.chatService.registerMember(
						chatId,
						userId,
						msg.from.username || '',
						msg.from.first_name || '',
						msg.from.last_name || ''
					)

					console.log(`Автоматически зарегистрирован пользователь: ${username} (${userId}) в группе ${chatId}`)
					
					// Отправляем уведомление о регистрации только если это не команда бота
					if (!messageText.startsWith('/')) {
						const userTag = msg.from.username ? `@${msg.from.username}` : (msg.from.first_name || 'Пользователь')
						const welcomeText = `✅ ${userTag}, вы автоматически зарегистрированы в системе!`
						
						// Отправляем уведомление, которое самоудалится через 5 секунд
						const sentMessage = await bot.sendMessage(chatId, welcomeText)
						
						setTimeout(async () => {
							try {
								await bot.deleteMessage(chatId, sentMessage.message_id)
							} catch (deleteError) {
								console.warn('Не удалось удалить уведомление о регистрации:', deleteError)
							}
						}, 5000)
					}
				}
			} catch (error) {
				console.error('Ошибка автоматической регистрации:', error)
			}
		}
	}

	// Обработка изменения статуса бота в чате (добавление/удаление)
	private async handleMyChatMember(bot: TelegramBot, msg: any): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
		const newStatus = msg.new_chat_member?.status
		const oldStatus = msg.old_chat_member?.status

		if (!isGroup) return

		try {
			// Если бот был добавлен в группу (стал участником)
			if (newStatus === 'member' && (oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus)) {
				console.log(`Бот добавлен в группу: ${msg.chat.title}`)
				await this.handleBotAddedToGroup(bot, msg, false)
			}
			// Если бот стал администратором
			else if (newStatus === 'administrator' && oldStatus === 'member') {
				console.log(`Бот получил права администратора в группе: ${msg.chat.title}`)
				await this.handleBotBecameAdmin(bot, msg)
			}
			// Если бот был добавлен сразу как администратор
			else if (newStatus === 'administrator' && (oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus)) {
				console.log(`Бот добавлен в группу как администратор: ${msg.chat.title}`)
				await this.handleBotAddedToGroup(bot, msg, true)
			}
		} catch (error) {
			console.error('Ошибка при обработке изменения статуса бота:', error)
		}
	}

	// Обработка добавления бота в группу
	private async handleBotAddedToGroup(bot: TelegramBot, msg: any, isAdmin: boolean): Promise<void> {
		const chatId = msg.chat.id.toString()

		// Создаем или получаем чат
		await this.chatService.getOrCreateChat(
			chatId,
			msg.chat.title || 'Unknown Group',
			msg.chat.username
		)

		// Пытаемся зарегистрировать существующих участников, если есть доступ к сообщениям
		await this.registerExistingMembers(bot, chatId)

		// Отправляем приветственное сообщение с кнопкой регистрации
		const welcomeMessage = '🎉 Привет! Я бот для управления задачами в группах!\n\n' +
			'🤖 Что я умею:\n' +
			'📋 Создавать и управлять задачами\n' +
			'🎙️ Обрабатывать голосовые сообщения с помощью ИИ\n' +
			'👥 Управлять участниками и ролями\n' +
			'📊 Отслеживать прогресс выполнения\n\n' +
			(isAdmin ? 
				'✅ У меня есть права администратора - сейчас закреплю это сообщение!' :
				'⚠️ Для полной функциональности сделайте меня администратором группы')

		const keyboard = {
			inline_keyboard: [
				[{ text: '📝 Зарегистрироваться', callback_data: 'register' }]
			]
		}

		const sentMessage = await bot.sendMessage(chatId, welcomeMessage, {
			reply_markup: keyboard
		})

		if (isAdmin) {
			// Если бот уже админ, сразу закрепляем сообщение
			try {
				await bot.pinChatMessage(chatId, sentMessage.message_id)
				await this.chatService.updateWelcomeMessageId(chatId, sentMessage.message_id)
				bot.sendMessage(chatId, '📌 Приветственное сообщение закреплено!')
			} catch (error) {
				console.error('Ошибка закрепления сообщения:', error)
			}
		} else {
			// Сохраняем ID сообщения для последующего закрепления
			await this.chatService.updateWelcomeMessageId(chatId, sentMessage.message_id)
		}
	}

	// Обработка получения прав администратора
	private async handleBotBecameAdmin(bot: TelegramBot, msg: any): Promise<void> {
		const chatId = msg.chat.id.toString()

		try {
			// Получаем ID приветственного сообщения
			const welcomeMessageId = await this.chatService.getWelcomeMessageId(chatId)

			if (welcomeMessageId) {
				// Закрепляем приветственное сообщение
				await bot.pinChatMessage(chatId, welcomeMessageId)
				bot.sendMessage(chatId, '🎉 Отлично! Теперь у меня есть права администратора.\n📌 Приветственное сообщение закреплено!')
			} else {
				// Если нет сохраненного сообщения, отправляем новое
				bot.sendMessage(chatId, '🎉 Спасибо за права администратора! Теперь я могу полноценно работать в этой группе.')
			}
		} catch (error) {
			console.error('Ошибка при обработке получения прав администратора:', error)
			bot.sendMessage(chatId, '🎉 Спасибо за права администратора!')
		}
	}

	// Регистрация существующих участников (если есть доступ к сообщениям)
	private async registerExistingMembers(bot: TelegramBot, chatId: string): Promise<void> {
		try {
			// Пытаемся получить администраторов чата
			const chatAdministrators = await bot.getChatAdministrators(chatId)
			
			let registeredCount = 0
			for (const admin of chatAdministrators) {
				if (admin.user.is_bot) continue // Пропускаем ботов
				
				const isRegistered = await this.chatService.isMemberRegistered(chatId, admin.user.id.toString())
				if (!isRegistered) {
					await this.chatService.registerMember(
						chatId,
						admin.user.id.toString(),
						admin.user.username || '',
						admin.user.first_name || '',
						admin.user.last_name || ''
					)
					registeredCount++
				}
			}

			if (registeredCount > 0) {
				console.log(`Автоматически зарегистрировано ${registeredCount} администраторов в группе ${chatId}`)
			}

		} catch (error) {
			console.warn('Не удалось получить список администраторов для автоматической регистрации:', error)
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
