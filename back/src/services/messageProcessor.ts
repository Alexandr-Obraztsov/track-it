import TelegramBot from 'node-telegram-bot-api'
import { ContextService } from './contextService'
import { GeminiService } from './geminiService'
import { TaskService } from './taskService'
import { AudioTranscriptionResponse, Task, TaskOperation } from '../types'
import { MessageFormatter, TaskFormatter, OperationFormatter } from './formatter'
import { convertOggToMp3, ensureDownloadsDirectory } from '../utils/fileUtils'
import path from 'path'
import * as fs from 'fs'

/**
 * Универсальный процессор сообщений для обработки голосовых и текстовых сообщений
 * 
 * @description Центральный сервис для обработки всех типов сообщений от пользователей.
 * Автоматически определяет тип сообщения (голосовое/текстовое), получает контекст,
 * обрабатывает через Gemini AI и выполняет необходимые действия с задачами.
 * 
 * @example
 * ```typescript
 * const messageProcessor = new MessageProcessor(contextService, geminiService, taskService)
 * const response = await messageProcessor.processMessage(bot, message)
 * ```
 */
export class MessageProcessor {
	private contextService: ContextService
	private geminiService: GeminiService
	private taskService: TaskService

	/**
	 * Создает экземпляр MessageProcessor
	 * 
	 * @param contextService - Сервис для получения контекста
	 * @param geminiService - Сервис для работы с Gemini AI
	 * @param taskService - Сервис для работы с задачами
	 */
	constructor(contextService: ContextService, geminiService: GeminiService, taskService: TaskService) {
		this.contextService = contextService
		this.geminiService = geminiService
		this.taskService = taskService
		ensureDownloadsDirectory()
	}

	/**
	 * Универсальный метод обработки голосовых и текстовых сообщений
	 * 
	 * @description Обрабатывает входящие сообщения, управляет реакциями Telegram
	 * и выполняет основную логику обработки через Gemini AI.
	 * 
	 * @param bot - Экземпляр Telegram бота
	 * @param msg - Сообщение для обработки
	 * 
	 * @example
	 * ```typescript
	 * await messageProcessor.handleMessage(bot, message)
	 * ```
	 */
	async handleMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isVoiceMessage = !!msg.voice
		const isTextMessage = !!msg.text
		
		if (!isVoiceMessage && !isTextMessage) return

		try {
			// Ставим реакцию думающего смайлика для индикации обработки
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '🤔' }],
				})
			} catch (reactionError) {
				console.warn(MessageFormatter.ERRORS.GENERAL, reactionError)
			}

			// Обрабатываем сообщение
			const response = await this.processMessage(bot, msg)

			// Отправляем ответ
			await bot.sendMessage(chatId, response, {
					reply_to_message_id: msg.message_id,
					parse_mode: 'HTML'
				})

			// Ставим реакцию галочки после успешной обработки
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '🍓' }],
					is_big: false,
				})
			} catch (reactionError) {
				console.warn(MessageFormatter.ERRORS.GENERAL, reactionError)
			}

		} catch (error) {
			console.error('Error processing message:', error)

			// Ставим реакцию ошибки при неудачной обработке
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '💔' }],
					is_big: false,
				})
			} catch (reactionError) {
				console.warn(MessageFormatter.ERRORS.GENERAL, reactionError)
			}

			await bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}

	/**
	 * Обрабатывает сообщение (голосовое или текстовое)
	 * 
	 * @description Универсальный метод для обработки всех типов сообщений.
	 * Автоматически определяет тип сообщения, получает контекст, обрабатывает
	 * через Gemini AI и возвращает отформатированный ответ.
	 * 
	 * @param bot - Экземпляр Telegram бота
	 * @param msg - Сообщение для обработки
	 * @returns Отформатированный ответ для пользователя
	 * 
	 * @example
	 * ```typescript
	 * const response = await messageProcessor.processMessage(bot, message)
	 * await bot.sendMessage(chatId, response)
	 * ```
	 */
	private async processMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<string> {
		const chatId = msg.chat.id.toString()
		const userId = msg.from!.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
		
		// Определяем тип сообщения
		const isVoiceMessage = !!msg.voice
		const isTextMessage = !!msg.text
		
		if (!isVoiceMessage && !isTextMessage) {
			return MessageFormatter.ERRORS.GENERAL
		}

		// Переменные для голосовых файлов
		let oggPath: string | undefined
		let mp3Path: string | undefined

		try {
			// Обрабатываем голосовое сообщение
			if (isVoiceMessage) {
				const voiceResult = await this.processVoiceMessage(bot, msg)
				oggPath = voiceResult.oggPath
				mp3Path = voiceResult.mp3Path
			}

			// Получаем контекст
			const context = await this.contextService.getContext(msg)

			// Обрабатываем через Gemini
			const geminiResult = await this.geminiService.processMessage(
				isVoiceMessage ? mp3Path! : msg.text!,
				context.author,
				context.tasks,
				context.roles,
				context.members,
				context.isGroup,
				isVoiceMessage
			)

			// Проверяем что получили валидный ответ
			if (!geminiResult) {
				return MessageFormatter.ERRORS.UNAVAILABLE
			}

			// Обрабатываем ответ от Gemini
			if (typeof geminiResult === 'string') {
				return geminiResult
			}

			const geminiResponse = geminiResult as AudioTranscriptionResponse

			// Формируем ответ пользователю
			return await this.processGeminiResponse(geminiResponse, chatId, userId, context.isGroup, context.members)

		} catch (error) {
			console.error('Error processing message:', error)
			return MessageFormatter.ERRORS.GENERAL
		} finally {
			// Очищаем файлы только для голосовых сообщений
			if (isVoiceMessage && oggPath && mp3Path) {
				this.cleanupFiles(oggPath, mp3Path)
			}
		}
	}

	/**
	 * Обрабатывает голосовое сообщение
	 */
	private async processVoiceMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<{ oggPath: string, mp3Path: string }> {
		const fileId = msg.voice!.file_id
		const oggFileName = `voice_${Date.now()}.ogg`
		const mp3FileName = `voice_${Date.now()}.mp3`
		const downloadsDir = path.join(__dirname, '../downloads')
		const oggPath = path.join(downloadsDir, oggFileName)
		const mp3Path = path.join(downloadsDir, mp3FileName)

		// Скачиваем файл
		const fileInfo = await bot.getFile(fileId)
		const downloadResult = await bot.downloadFile(fileId, downloadsDir)

		let downloadedFilePath: string
		if (typeof downloadResult === 'string') {
			downloadedFilePath = downloadResult
		} else {
			throw new Error('Download returned a stream instead of file path')
		}

		// Переименовываем файл
		if (fs.existsSync(downloadedFilePath)) {
			fs.renameSync(downloadedFilePath, oggPath)
		} else {
			throw new Error(`Downloaded file not found at ${downloadedFilePath}`)
		}

		if (!fs.existsSync(oggPath)) {
			throw new Error(`OGG file not found at ${oggPath}`)
		}

		// Конвертируем в MP3
		await convertOggToMp3(oggPath, mp3Path)

		if (!fs.existsSync(mp3Path)) {
			throw new Error(`MP3 file not created at ${mp3Path}`)
		}

		return { oggPath, mp3Path }
	}

	/**
	 * Обрабатывает ответ от Gemini
	 */
	private async processGeminiResponse(
		geminiResponse: AudioTranscriptionResponse,
		chatId: string,
		userId: string,
		isGroup: boolean,
		members: any[]
	): Promise<string> {
		// Проверяем есть ли кастомное сообщение (когда нет действий)
		if (geminiResponse.customMessage) {
			return geminiResponse.customMessage
		}

		const formattedResponse = []

		// Создаем задачи
		if (geminiResponse.tasks && geminiResponse.tasks.length > 0) {
			formattedResponse.push(await this.processTasksCreation(geminiResponse.tasks, userId, chatId, isGroup))
		}

		// Обрабатываем операции с задачами
		if (geminiResponse.taskOperations && geminiResponse.taskOperations.length > 0) {
			formattedResponse.push(await this.processTaskOperations(geminiResponse.taskOperations, isGroup))
		}

		// Если ничего не было сделано, выводим стандартное сообщение
		if (formattedResponse.length === 0) {
			return 'Задач не обнаружено 🤷‍♂️'
		}

		return formattedResponse.join('\n\n')
	}

	/**
	 * Обрабатывает создание задач
	 */
	private async processTasksCreation(tasks: Task[], userId: string, chatId: string, isGroup: boolean): Promise<string> {
		const result = [MessageFormatter.SUCCESS]
		for (const task of tasks) {
			try {
				// Создаем задачу через новый API
				const createdTask = await this.taskService.createTask({
					title: task.title,
					description: task.description,
					deadline: task.deadline ? new Date(task.deadline) : undefined,
					chatId: isGroup ? chatId : undefined,
					// Если не указан назначенный пользователь, назначаем текущего пользователя
					assignedUserId: task.assignedUserId ?? userId,
					assignedRoleId: task.assignedRoleId ?? undefined,
				})

				// Используем красивое форматирование новой задачи
				result.push(TaskFormatter.formatTask(createdTask))
			} catch (dbError) {
				console.error('Ошибка сохранения задачи в БД:', dbError)
				result.push(MessageFormatter.ERRORS.GENERAL + '\n')
			}
		}
		return result.join('\n\n')
	}

	/**
	 * Обрабатывает операции с задачами
	 */
	private async processTaskOperations(operations: TaskOperation[], isGroup: boolean): Promise<string> {
		const response = []

		for (const operation of operations) {
			try {
				const task = await this.taskService.getTaskById(operation.taskId)
				if (!task) continue

				switch (operation.operation) {
					case 'delete':
						const deleteSuccess = await this.taskService.deleteTask(task.id)
						response.push(OperationFormatter.formatTaskOperation(operation.operation, task))
						break

					case 'update':
						if (operation.updateData) {
							const updateData = {
								...operation.updateData,
								deadline: operation.updateData.deadline
									? new Date(operation.updateData.deadline)
									: undefined,
							}

							const updatedTask = await this.taskService.updateTask(task.id, updateData)
							if (updatedTask) {
								response.push(OperationFormatter.formatTaskUpdate(task, updatedTask, operation.updateData))
							}
						}
						break

					case 'complete':
						const completeData = { isCompleted: true }
						const completedTask = await this.taskService.updateTask(task.id, completeData)
						if (completedTask) {
							response.push(OperationFormatter.formatTaskUpdate(task, completedTask, completeData))
						}
						break
				}
			} catch (operationError) {
				console.error(MessageFormatter.ERRORS.GENERAL, operationError)
				response.push(MessageFormatter.ERRORS.GENERAL + '\n')
			}
		}

		return response.join('\n')
	}

	/**
	 * Очистка файлов
	 */
	private cleanupFiles(oggPath: string, mp3Path: string): void {
		if (fs.existsSync(oggPath)) {
			fs.unlinkSync(oggPath)
		}
		if (fs.existsSync(mp3Path)) {
			fs.unlinkSync(mp3Path)
		}
	}
}
