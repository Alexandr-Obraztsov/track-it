import 'dotenv/config'
import 'reflect-metadata'
import express, { Application } from 'express'
import { DataSource } from 'typeorm'
import { TaskEntity } from './entities/Task'
import { UserEntity } from './entities/User'
import { TaskService } from './services/taskService'
import { TelegramBotController } from './controllers/telegramBotController'
import logger from './middleware/logger'
import { ChatService } from './services/chatService'
import { ChatMemberEntity } from './entities/ChatMember'
import { ChatEntity } from './entities/Chat'
import { RoleEntity } from './entities/Role'
import { UserService } from './services/userService'
import { RoleService } from './services/roleService'
import { GeminiService } from './services/geminiService'
import { NotificationService } from './services/notificationService'

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', error => {
	console.error('Uncaught Exception:', error)
})

// Глобальные переменные для работы с БД
export let dataSource: DataSource
export let taskService: TaskService
export let chatService: ChatService
export let userService: UserService
export let roleService: RoleService
export let geminiService: GeminiService
export let telegramBotController: TelegramBotController
export let notificationService: NotificationService

// Класс сервера
class Server {
	private app: Application
	private port: number

	constructor(port: number = 3000) {
		this.app = express()
		this.port = port
		this.initializeDatabase()
		this.initializeMiddleware()
		this.initializeRoutes()
	}

	// Инициализация подключения к базе данных
	private async initializeDatabase(): Promise<void> {
		dataSource = new DataSource({
			type: 'postgres',
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '5432'),
			username: process.env.DB_USER || 'user',
			password: process.env.DB_PASSWORD || 'password',
			database: process.env.DB_NAME || 'trackit',
			entities: [TaskEntity, UserEntity, ChatEntity, ChatMemberEntity, RoleEntity],
			synchronize: true, // В продакшене использовать миграции
			logging: false,
			dropSchema: true,
		})

		try {
			await dataSource.initialize()
			taskService = new TaskService(dataSource)
			chatService = new ChatService(dataSource)
			userService = new UserService(dataSource)
			roleService = new RoleService(dataSource)
			geminiService = new GeminiService(process.env.GEMINI_API_KEY || '')
			// Инициализируем Telegram бота после подключения к БД
			telegramBotController = new TelegramBotController(
				taskService,
				chatService,
				roleService,
				geminiService,
				userService
			)
			
			// Инициализируем сервис нотификаций после создания бота
			const bot = telegramBotController.getBot()
			if (bot) {
				notificationService = new NotificationService(dataSource, bot)
				// Запускаем планировщик уведомлений
				notificationService.startNotificationScheduler()
				console.log('✅ Сервис уведомлений запущен')
			} else {
				console.error('❌ Ошибка: не удалось получить экземпляр Telegram бота для сервиса уведомлений')
			}
			
			console.log('База данных подключена успешно')
		} catch (error) {
			console.error('Ошибка подключения к базе данных:', error)
		}
	}

	// Инициализация middleware
	private initializeMiddleware(): void {
		this.app.use(express.json())
		this.app.use(logger)
	}

	// Инициализация маршрутов
	private initializeRoutes(): void {
		this.app.get('/', (req, res) => {
			res.send('Сервер работает!')
		})
	}

	// Запуск сервера
	public start(): void {
		this.app.listen(this.port, () => {
			console.log(`Сервер запущен на порту ${this.port}`)
		})
	}
}

const server = new Server()
server.start()
