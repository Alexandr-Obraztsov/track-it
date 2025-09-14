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
			await this.callbackHandler.handleCallbackQuery(this.bot!, callbackQuery)
		})
		
		// Обработка команды /start
		this.bot.onText(/\/start/, async msg => {
			await this.commandHandler.handleStart(this.bot!, msg)
		})

		// Обработка команды /help
		this.bot.onText(/\/help/, async msg => {
			await this.commandHandler.handleHelp(this.bot!, msg)
		})

		// Обработка команды /register
		this.bot.onText(/\/register/, async msg => {
			await this.commandHandler.handleRegister(this.bot!, msg)
		})

		// Обработка команды /members
		this.bot.onText(/\/members/, async msg => {
			await this.commandHandler.handleMembers(this.bot!, msg)
		})

		// Обработка команды /pin_welcome
		this.bot.onText(/\/pin_welcome/, async msg => {
			await this.commandHandler.handlePinWelcome(this.bot!, msg)
		})

		// Обработка команды /tasks
		this.bot.onText(/\/tasks/, async msg => {
			await this.commandHandler.handleTasks(this.bot!, msg)
		})

		// Обработка команды /roles
		this.bot.onText(/\/roles/, async msg => {
			await this.commandHandler.handleRoles(this.bot!, msg)
		})

		// Обработка команды /add
		this.bot.onText(/\/add (.+)/, async (msg, match) => {
			await this.textCommandHandler.handleAddTask(this.bot!, msg, match)
		})

		// Обработка команды /delete
		this.bot.onText(/\/delete (.+)/, async (msg, match) => {
			await this.textCommandHandler.handleDeleteTask(this.bot!, msg, match)
		})

		// Обработка команды /assign
		this.bot.onText(/\/assign (.+)/, async (msg, match) => {
			await this.textCommandHandler.handleAssignTask(this.bot!, msg, match)
		})

		// Обработка команды /complete
		this.bot.onText(/\/complete (.+)/, async (msg, match) => {
			await this.textCommandHandler.handleCompleteTask(this.bot!, msg, match)
		})

		// Обработка команды назначения роли
		this.bot.onText(/\/role_assign (.+)/, async (msg, match) => {
			await this.commandHandler.handleRoleAssign(this.bot!, msg, match)
		})

		// Обработка команды удаления роли
		this.bot.onText(/\/role_remove (.+)/, async (msg, match) => {
			await this.commandHandler.handleRoleRemove(this.bot!, msg, match)
		})

		// Обработка голосовых сообщений
		this.bot.on('voice', async msg => {
			await this.voiceHandler.handleVoiceMessage(this.bot!, msg)
		})

		// Обработка любых сообщений для логирования
		this.bot.on('message', msg => {
			const chatId = msg.chat.id.toString()
			const messageText = msg.text || msg.caption || '[системное сообщение]'
			const username = msg.from?.username || msg.from?.first_name || 'unknown'
			console.log(`Received message: ${messageText} from ${username}`)
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
