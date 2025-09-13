import TelegramBot from 'node-telegram-bot-api'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { GeminiService } from '../services/geminiService'
import { taskService } from '../server'

// Контроллер для Telegram бота
class TelegramBotController {
	private bot?: TelegramBot
	private token: string
	private geminiService?: GeminiService

	// Функция для перевода приоритета на русский
	private translatePriority(priority: 'high' | 'medium' | 'low'): string {
		switch (priority) {
			case 'high': return 'высокий'
			case 'medium': return 'средний'
			case 'low': return 'низкий'
			default: return priority
		}
	}

	constructor() {
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
		}
		this.bot = new TelegramBot(this.token, botOptions)
		this.initializeHandlers()
		this.initializeErrorHandling()
		this.ensureDownloadsDirectory()
		console.log('Бот инициализирован успешно')
	}

	// Создание директории для загрузок, если не существует
	private ensureDownloadsDirectory(): void {
		const downloadsDir = path.join(__dirname, '../downloads')
		if (!fs.existsSync(downloadsDir)) {
			fs.mkdirSync(downloadsDir, { recursive: true })
		}
	}

	// Конвертация OGG в MP3
	private async convertOggToMp3(
		inputPath: string,
		outputPath: string
	): Promise<void> {
		return new Promise((resolve, reject) => {
			ffmpeg(inputPath)
				.toFormat('mp3')
				.on('end', () => resolve())
				.on('error', (err: any) => reject(err))
				.save(outputPath)
		})
	}

	private initializeHandlers(): void {
		if (!this.bot) return
		
		// Обработка команды /start
		this.bot.onText(/\/start/, msg => {
			const chatId = msg.chat.id
			this.sendMessage(chatId, 'Привет! Я бот для управления задачами. Отправь голосовое сообщение, чтобы извлечь задачи, или используй команды:\n/tasks - показать все задачи\n/add [задача] - добавить задачу\n/delete [id] - удалить задачу')
		})

		// Обработка команды /help
		this.bot.onText(/\/help/, msg => {
			const chatId = msg.chat.id
			this.sendMessage(
				chatId,
				'Доступные команды:\n/start - Запуск бота\n/help - Помощь\n/tasks - Показать все задачи\n/add [задача] - Добавить задачу\n/delete [id] - Удалить задачу\nОтправь голосовое сообщение для извлечения задач из аудио'
			)
		})

		// Обработка команды /tasks
		this.bot.onText(/\/tasks/, async msg => {
			const chatId = msg.chat.id
			try {
				const tasks = await taskService.getTasksByUser(chatId)
				if (tasks.length === 0) {
					this.sendMessage(chatId, 'У вас нет задач')
				} else {
					let response = 'Ваши задачи:\n'
					tasks.forEach((task, index) => {
						response += `\n${index + 1}. ${task.title}\n`
						response += `   Описание: ${task.description}\n`
						response += `   Приоритет: ${this.translatePriority(task.priority)}\n`
						if (task.deadline) {
							response += `   Срок: ${task.deadline}\n`
						}
						response += `   ID: ${task.id}\n`
					})
					this.sendMessage(chatId, response)
				}
			} catch (error) {
				console.error('Ошибка получения задач:', error)
				this.sendMessage(chatId, 'Ошибка получения задач')
			}
		})

		// Обработка команды /add
		this.bot.onText(/\/add (.+)/, async msg => {
			const chatId = msg.chat.id
			const taskText = msg.text!.replace('/add ', '')
			try {
				await taskService.createTask({
					title: taskText,
					description: taskText,
					priority: 'medium',
					deadline: null,
					userId: chatId
				})
				this.sendMessage(chatId, `Задача "${taskText}" добавлена`)
			} catch (error) {
				console.error('Ошибка добавления задачи:', error)
				this.sendMessage(chatId, 'Ошибка добавления задачи')
			}
		})

		// Обработка команды /delete
		this.bot.onText(/\/delete (\d+)/, async msg => {
			const chatId = msg.chat.id
			const taskId = parseInt(msg.text!.replace('/delete ', ''))
			try {
				const deleted = await taskService.deleteTask(taskId, chatId)
				if (deleted) {
					this.sendMessage(chatId, `Задача ${taskId} удалена`)
				} else {
					this.sendMessage(chatId, `Задача ${taskId} не найдена`)
				}
			} catch (error) {
				console.error('Ошибка удаления задачи:', error)
				this.sendMessage(chatId, 'Ошибка удаления задачи')
			}
		})

		// Handle voice messages
		this.bot.on('voice', async msg => {
			const chatId = msg.chat.id
			const fileId = msg.voice!.file_id
			const oggFileName = `voice_${Date.now()}.ogg`
			const mp3FileName = `voice_${Date.now()}.mp3`
			const downloadsDir = path.join(__dirname, '../downloads')
			const oggPath = path.join(downloadsDir, oggFileName)
			const mp3Path = path.join(downloadsDir, mp3FileName)

			try {
				console.log(`Processing voice message with fileId: ${fileId}`)

				// Get file info first
				const fileInfo = await this.bot!.getFile(fileId)
				console.log(`File info:`, fileInfo)

				// Download file
				const downloadResult = await this.bot!.downloadFile(
					fileId,
					downloadsDir
				)
				console.log(`Download result type:`, typeof downloadResult)

				let downloadedFilePath: string

				if (typeof downloadResult === 'string') {
					// downloadFile returned a file path
					downloadedFilePath = downloadResult
					console.log(`Downloaded to: ${downloadedFilePath}`)
				} else {
					// downloadFile returned a stream - this shouldn't happen with our usage
					throw new Error('Download returned a stream instead of file path')
				}

				// Check if file exists and rename it
				if (fs.existsSync(downloadedFilePath)) {
					fs.renameSync(downloadedFilePath, oggPath)
					console.log(`Renamed to: ${oggPath}`)
				} else {
					throw new Error(`Downloaded file not found at ${downloadedFilePath}`)
				}

				// Verify OGG file exists
				if (!fs.existsSync(oggPath)) {
					throw new Error(`OGG file not found at ${oggPath}`)
				}


				// Convert to MP3
				await this.convertOggToMp3(oggPath, mp3Path)

				// Verify MP3 file exists
				if (!fs.existsSync(mp3Path)) {
					throw new Error(`MP3 file not created at ${mp3Path}`)
				}

				// Process with Gemini
				const geminiResponse = this.geminiService ? await this.geminiService.processAudio(mp3Path) : 'Gemini AI is not configured'

				// Format response for user
				let formattedResponse: string
				if (typeof geminiResponse === 'string') {
					formattedResponse = geminiResponse
				} else {
					formattedResponse = 'Найденные задачи:\n'
					
					if (geminiResponse.tasks.length === 0) {
						formattedResponse += 'Задач не найдено'
					} else {
						// Сохраняем задачи в БД
						for (const task of geminiResponse.tasks) {
							try {
								await taskService.createTask({
									...task,
									userId: chatId
								})
							} catch (dbError) {
								console.error('Ошибка сохранения задачи в БД:', dbError)
							}
						}

						geminiResponse.tasks.forEach((task, index) => {
							formattedResponse += `\n${index + 1}. ${task.title}\n`
							formattedResponse += `   Описание: ${task.description}\n`
							formattedResponse += `   Приоритет: ${this.translatePriority(task.priority)}\n`
							if (task.deadline) {
								formattedResponse += `   Срок: ${task.deadline}\n`
							}
						})
					}
				}

				// Send response back to user
				this.sendMessage(chatId, formattedResponse)

				// Clean up files
				if (fs.existsSync(oggPath)) {
					fs.unlinkSync(oggPath)
					console.log(`Cleaned up OGG file: ${oggPath}`)
				}
				if (fs.existsSync(mp3Path)) {
					fs.unlinkSync(mp3Path)
					console.log(`Cleaned up MP3 file: ${mp3Path}`)
				}

				console.log(`Voice message processed successfully: ${mp3FileName}`)
			} catch (error) {
				console.error('Error processing voice message:', error)

				let errorMessage = 'Unknown error occurred'
				let isProxyError = false

				if (error instanceof Error) {
					errorMessage = error.message

					// Check for common proxy-related errors
					if (
						errorMessage.includes('timeout') ||
						errorMessage.includes('ECONNREFUSED') ||
						errorMessage.includes('ENOTFOUND') ||
						errorMessage.includes('proxy')
					) {
						isProxyError = true
						console.warn('Proxy-related error detected:', errorMessage)
					}
				}

				// Provide user-friendly error message
				let userMessage = `Error processing voice message: ${errorMessage}`

				if (isProxyError) {
					userMessage +=
						'\n\nNote: There may be connectivity issues. The system will retry with direct connection if available.'
				}

				this.sendMessage(chatId, userMessage)

				// Clean up any partial files
				try {
					if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath)
					if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path)
				} catch (cleanupError) {
					console.warn('Error during cleanup:', cleanupError)
				}
			}
		})

		// Handle any message
		this.bot.on('message', msg => {
			const chatId = msg.chat.id
			console.log(`Received message: ${msg.text} from ${msg.from?.username}`)
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

	public sendMessage(chatId: number, text: string): void {
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

const telegramBotController = new TelegramBotController()
export { telegramBotController, TelegramBotController }
