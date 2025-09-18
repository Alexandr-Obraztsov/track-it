import TelegramBot from 'node-telegram-bot-api'
import { GeminiService } from '../services/geminiService'
import { TaskService } from '../services/taskService'
import { ChatService } from '../services/chatService'
import { RoleService } from '../services/roleService'
import { CommandHandlerService } from '../services/commandHandlerService'
import { CallbackHandlerService } from '../services/callbackHandlerService'
import { VoiceHandlerService } from '../services/voiceHandlerService'
import { UserService } from '../services/userService'
import { MessageFormatterService } from '../services/messageFormatterService'

// Контроллер для Telegram бота
class TelegramBotController {
	private bot?: TelegramBot
	private token: string
	private taskService: TaskService
	private chatService: ChatService
	private roleService: RoleService
  private commandHandler: CommandHandlerService
  private callbackHandler: CallbackHandlerService
  private voiceHandler: VoiceHandlerService
	private geminiService: GeminiService
	private userService: UserService

	constructor(taskService: TaskService, chatService: ChatService, roleService: RoleService, geminiService: GeminiService, userService: UserService) {
		this.taskService = taskService
		this.chatService = chatService
		this.roleService = roleService
		this.geminiService = geminiService
		this.userService = userService
		
		// Инициализируем сервисы обработки
		this.voiceHandler = new VoiceHandlerService(taskService, chatService, roleService, userService, geminiService)
		this.commandHandler = new CommandHandlerService()
		this.callbackHandler = new CallbackHandlerService(taskService, chatService, userService)
		
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
	private async handleNewChatMembers(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const user = msg.from
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

		if (!isGroup || !user) return

		try {
			// Создаем или получаем чат
			await this.chatService.createOrGetChat(
				{
					telegramId: chatId,
					title: msg.chat.title || 'Unknown Group',
					username: msg.chat.username
				}
			)


			if (user.is_bot) return // Игнорируем ботов

			// Регистрируем нового участника
			const member = await this.userService.createOrGetUser(
				{
					telegramId: user.id.toString(),
					username: user.username!,
					firstName: user.first_name,
					lastName: user.last_name
				}
			)

			// Автоматически регистрируем нового участника
			await this.chatService.addMember(
				chatId,
				member.telegramId.toString(),
			)

			const personalWelcome = `👋 Привет, ${MessageFormatterService.getTag(member)}! Добро пожаловать в группу!\n\n` +
					'✅ Вы автоматически зарегистрированы в системе.\n' +
					'📌 Обратите внимание на закрепленное сообщение с инструкциями.\n' +
					'🎙️ Просто отправьте голосовое сообщение с вашей просьбой!'

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
		const messageText = msg.text || msg.caption || '[системное сообщение]'
		
		
		// Автоматическая регистрация в групповых чатах
		if (isGroup && user && !user.is_bot) {
			console.log(`Received message: ${messageText} from ${user?.username!}`)
			try {
				// Создаем или получаем чат
				await this.chatService.createOrGetChat(
					{
						telegramId: chat.id.toString(),
						title: chat.title || 'Unknown Group',
						username: chat.username
					}
				)

				const member = await this.userService.createOrGetUser(
					{
						telegramId: user.id.toString(),
						username: user.username!,
						firstName: user.first_name || '',
						lastName: user.last_name || ''
					}
				)

				// Проверяем, зарегистрирован ли пользователь
				const isRegistered = await this.chatService.isMember(chat.id.toString(), user.id.toString())
				
				if (!isRegistered) {
					// Автоматически регистрируем пользователя
					await this.chatService.addMember(
						chat.id.toString(),
						user.id.toString(),
					)

					console.log(`Автоматически зарегистрирован пользователь: ${user.username} (${user.id}) в группе ${chat.id}`)

					// Отправляем уведомление о регистрации только если это не команда бота
					if (!messageText.startsWith('/')) {
						const userTag = MessageFormatterService.getTag(member)
						const welcomeText = `✅ ${userTag}, вы автоматически зарегистрированы в системе!`
						
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
				}
			} catch (error) {
				console.error('Ошибка автоматической регистрации:', error)
			}
		}
	}

	// Обработка изменения статуса бота в чате (добавление/удаление)
	private async handleMyChatMember(bot: TelegramBot, msg: TelegramBot.ChatMemberUpdated): Promise<void> {
		const chat = msg.chat
		const isGroup = chat.type === 'group' || 	chat.type === 'supergroup'
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
	private async handleBotAddedToGroup(bot: TelegramBot, msg: TelegramBot.ChatMemberUpdated, isAdmin: boolean): Promise<void> {
		const chat = msg.chat

		// Создаем или получаем чат
		await this.chatService.createOrGetChat(
			{
				telegramId: chat.id.toString(),
				title: chat.title || 'Unknown Group',
				username: chat.username || ''
			}
		)

		// Пытаемся зарегистрировать существующих участников, если есть доступ к сообщениям
		await this.registerExistingMembers(bot, chat.id.toString())

		// Отправляем приветственное сообщение 
		const welcomeMessage = '🎉 Привет! Я голосовой бот для управления задачами!\n\n' +
			'🎙️ Просто отправьте голосовое сообщение с вашей просьбой:\n\n' +
			'📌 Примеры команд:\n' +
			'• "Создай задачу - сделать презентацию"\n' +
			'• "Покажи все задачи"\n' +
			'• "Назначь задачу сделать презентацию на Анну"\n' +
			'• "Отметь задачу сделать презентацию как выполненную"\n' +
			'• "Покажи участников группы"\n\n' +
			'✨ Говорите естественно - я пойму!\n\n' +
			(isAdmin ? 
				'✅ У меня есть права администратора - сейчас закреплю это сообщение!' :
				'⚠️ Для полной функциональности сделайте меня администратором группы')

		// Создаем inline клавиатуру с полезными кнопками
		const keyboard = {
			inline_keyboard: [
				[
					{
						text: '👤 Зарегистрироваться',
						callback_data: 'register'
					},
					
				],
			]
		}

		const sentMessage = await bot.sendMessage(chat.id.toString(), welcomeMessage, {
			reply_markup: keyboard
		})

		if (isAdmin) {
			// Если бот уже админ, сразу закрепляем сообщение
			try {
				await bot.pinChatMessage(chat.id.toString(), sentMessage.message_id)
				await this.chatService.updateWelcomeMessage(chat.id.toString(), sentMessage.message_id)
				bot.sendMessage(chat.id.toString(), '📌 Приветственное сообщение закреплено!')
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
				
				const isRegistered = await this.chatService.isMember(chatId, admin.user.id.toString())
				if (!isRegistered) {
					const member = await this.userService.createOrGetUser(
						{
							telegramId: admin.user.id.toString(),
							username: admin.user.username || '',
							firstName: admin.user.first_name || '',
							lastName: admin.user.last_name || ''
						}
					)
					await this.chatService.addMember(
						chatId,
						admin.user.id.toString(),
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
