import 'dotenv/config'
import 'reflect-metadata'
import express, { Application } from 'express'
import { DataSource } from 'typeorm'
import { TaskEntity } from './entities/Task'
import { ChatEntity } from './entities/Chat'
import { ChatMemberEntity } from './entities/ChatMember'
import { TaskService } from './services/taskService'
import { ChatService } from './services/chatService'
import './controllers/telegramBotController' // Инициализируем Telegram бота
import logger from './middleware/logger'

// Глобальные переменные для работы с БД
export let dataSource: DataSource
export let taskService: TaskService
export let chatService: ChatService

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
			entities: [TaskEntity, ChatEntity, ChatMemberEntity],
			synchronize: true, // В продакшене использовать миграции
			logging: false,
		})

		try {
			await dataSource.initialize()
			taskService = new TaskService(dataSource)
			chatService = new ChatService(dataSource)
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
