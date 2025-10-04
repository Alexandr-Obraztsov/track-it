import 'dotenv/config'
import 'reflect-metadata'
import express, { Application } from 'express'
import cors from 'cors'
import { DataSource } from 'typeorm'
import { TaskEntity } from './entities/Task'
import { UserEntity } from './entities/User'
import { TaskService } from './services/taskService'
import { TelegramBotController } from './controllers/telegramBotController'
import logger from './middleware/logger'
import { ChatService } from './services/chatService'
import { MessageFormatter } from './services/formatter'
import { ChatMemberEntity } from './entities/ChatMember'
import { ChatEntity } from './entities/Chat'
import { RoleEntity } from './entities/Role'
import { UserService } from './services/userService'
import { RoleService } from './services/roleService'
import { GeminiService } from './services/geminiService'
import { NotificationService } from './services/notificationService'
import apiRoutes from './routes'

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
				notificationService.startNotificationScheduler()
			} else {
				console.error('❌ Ошибка: не удалось получить экземпляр Telegram бота для сервиса уведомлений')
			}
			
		} catch (error) {
			console.error(MessageFormatter.ERRORS.GENERAL, error)
		}
	}

	// Инициализация middleware
	private initializeMiddleware(): void {
		// CORS для фронтенда (поддержка HTTP и HTTPS для локальной разработки)
		const allowedOrigins = [
			'http://localhost:5173',
			'https://localhost:5173',
			process.env.FRONTEND_URL,
		].filter(Boolean) // Убираем undefined если FRONTEND_URL не задан
		
		this.app.use(cors({
			origin: (origin, callback) => {
				// Разрешаем запросы без origin (например, Postman или curl)
				if (!origin) return callback(null, true)
				
				// Разрешаем localhost с любым портом
				if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
					return callback(null, true)
				}
				
				// Разрешаем локальные IP адреса (192.168.x.x, 10.x.x.x)
				if (origin.match(/^https?:\/\/(192\.168\.|10\.)\d+\.\d+:\d+$/)) {
					return callback(null, true)
				}
				
				// Проверяем whitelist
				if (allowedOrigins.includes(origin)) {
					return callback(null, true)
				}
				
				callback(new Error('Not allowed by CORS'))
			},
			credentials: true,
		}))
		this.app.use(express.json())
		this.app.use(logger)
	}

	// Инициализация маршрутов
	private initializeRoutes(): void {
		// Главная страница
		this.app.get('/', (req, res) => {
			res.send(MessageFormatter.BOT_MESSAGES.SERVER_WORKING)
		})
		
		// API маршруты
		this.app.use('/api', apiRoutes)
		
		// Обработка 404 для API
		this.app.use('/api/*', (req, res) => {
			res.status(404).json({
				success: false,
				error: 'API endpoint не найден'
			})
		})
	}

	// Запуск сервера
	public start(): void {
		// Слушаем на 0.0.0.0 чтобы быть доступным из локальной сети
		this.app.listen(this.port, '0.0.0.0', () => {
			console.log(`🚀 Сервер запущен на http://0.0.0.0:${this.port}`)
			console.log(`📱 Доступен в локальной сети`)
		})
	}
}

const server = new Server()
server.start()
