import 'dotenv/config'
import express, { Application } from 'express'
import './controllers/telegramBotController' // Инициализируем телеграм-бота
import logger from './middleware/logger'

class Server {
	private app: Application
	private port: number

	constructor(port: number = 3000) {
		this.app = express()
		this.port = port
		this.initializeMiddleware()
		this.initializeRoutes()
	}

	private initializeMiddleware(): void {
		this.app.use(express.json())
		this.app.use(logger)
	}

	private initializeRoutes(): void {
		this.app.get('/', (req, res) => {
			res.send('Hello World!')
		})
	}

	public start(): void {
		this.app.listen(this.port, () => {
			console.log(`Server is running on port ${this.port}`)
		})
	}
}

const server = new Server()
server.start()
