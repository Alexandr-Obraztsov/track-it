import TelegramBot from 'node-telegram-bot-api'
import { GeminiService } from './geminiService'
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'
import { UserService } from './userService'
import { TaskFormatter, OperationFormatter, MessageFormatter } from './formatter'
import path from 'path'
import {
    GeminiUser,
    GeminiRole,
    GeminiTask,
    GeminiChatMember,
    TaskOperation,
    AudioTranscriptionResponse,
    Task,
} from '../types'
import { convertOggToMp3, ensureDownloadsDirectory } from '../utils/fileUtils'
import * as fs from 'fs'

// Сервис для обработки голосовых сообщений
export class VoiceHandlerService {
	private taskService: TaskService
	private chatService: ChatService
	private roleService: RoleService
	private userService: UserService
	private geminiService?: GeminiService

	constructor(
		taskService: TaskService,
		chatService: ChatService,
		roleService: RoleService,
		userService: UserService,
		geminiService?: GeminiService
	) {
		this.taskService = taskService
		this.chatService = chatService
		this.roleService = roleService
		this.userService = userService
		this.geminiService = geminiService
		ensureDownloadsDirectory()
	}

	// Основной метод обработки голосового сообщения
	async handleVoiceMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const userId = msg.from!.id.toString()
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
		const fileId = msg.voice!.file_id
		const oggFileName = `voice_${Date.now()}.ogg`
		const mp3FileName = `voice_${Date.now()}.mp3`
		const downloadsDir = path.join(__dirname, '../downloads')
		const oggPath = path.join(downloadsDir, oggFileName)
		const mp3Path = path.join(downloadsDir, mp3FileName)

		try {
			// Ставим реакцию думающего смайлика для индикации обработки
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '🤔' }],
				})
			} catch (reactionError) {
				console.warn(MessageFormatter.ERRORS.GENERAL, reactionError)
				// Продолжаем обработку даже если реакция не сработала
			}

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

			// Получаем контекст для Gemini (полноценная схема БД)
			let roles: GeminiRole[] = []
			let tasks: GeminiTask[] = []
			let members: GeminiChatMember[] = []

			// Создаем объект автора запроса
			const author: GeminiUser = {
				telegramId: userId,
				username: msg.from?.username || userId,
				firstName: msg.from?.first_name || MessageFormatter.VARIANTS.UNKNOWN,
				lastName: msg.from?.last_name,
			}

			if (isGroup) {
				try {
					// Обеспечиваем существование пользователя и чата
					await this.userService.createOrGetUser({
						telegramId: userId,
						firstName: msg.from?.first_name || MessageFormatter.VARIANTS.UNKNOWN,
						lastName: msg.from?.last_name,
						username: msg.from?.username || userId,
					})

					await this.chatService.createOrGetChat({
						telegramId: chatId,
						title: msg.chat.title || MessageFormatter.ERRORS.NOT_FOUND,
						username: msg.chat.username,
					})

					// Получаем всех участников с полной информацией
					const chatMembers = await this.chatService.getChatMembers(chatId)

					// Формируем списки для Gemini
					members = chatMembers.map(member => ({
						userId: member.userId,
						username: member.user?.username || '',
						firstName: member.user?.firstName || MessageFormatter.VARIANTS.UNKNOWN,
						lastName: member.user?.lastName,
						roleId: member.roleId,
						roleName: member.role?.name,
					}))

					// Получаем все роли с участниками
					const chatRoles = await this.roleService.getChatRoles(chatId)
					roles = chatRoles.map(role => ({
						id: role.id,
						name: role.name,
						chatId: role.chatId,
						memberIds: role.members?.map(m => m.userId) || [],
					}))

					// Получаем все задачи с полной информацией
					const groupTasks = await this.taskService.getGroupTasks(chatId)
					tasks = groupTasks.map(task => ({
						id: task.id,
						readableId: task.readableId,
						title: task.title,
						description: task.description,
						deadline: task.deadline ? String(task.deadline) : null,
						type: task.type,
						chatId: task.chatId,
						assignedUserId: task.assignedUserId,
						assignedRoleId: task.assignedRoleId,
						isCompleted: task.isCompleted,
					}))
				} catch (error) {
					console.error(MessageFormatter.ERRORS.GENERAL, error)
				}
			} else {
				try {
					// Обеспечиваем существование пользователя
					const user = await this.userService.createOrGetUser({
						telegramId: userId,
						firstName: msg.from?.first_name || MessageFormatter.VARIANTS.UNKNOWN,
						lastName: msg.from?.last_name,
						username: msg.from?.username || userId,
					})

					members = [{
						userId: user.telegramId,
						username: user.username || '',
						firstName: user.firstName || MessageFormatter.VARIANTS.UNKNOWN,
						lastName: user.lastName,
						roleId: undefined,
						roleName: undefined,	
					}]

					// Получаем личные задачи
					const personalTasks = await this.taskService.getPersonalTasks(userId)
					tasks = personalTasks.map(task => ({
						id: task.id,
						readableId: task.readableId,
						title: task.title,
						description: task.description,
						deadline: task.deadline ? String(task.deadline) : null,
						type: task.type,
						chatId: task.chatId,
						assignedUserId: task.assignedUserId,
						assignedRoleId: task.assignedRoleId,
						isCompleted: task.isCompleted,
					}))
				} catch (error) {
					console.error(MessageFormatter.ERRORS.GENERAL, error)
				}
			}

			const geminiResult = this.geminiService
				? await this.geminiService.processAudio(mp3Path, author, tasks, roles, members, isGroup)
				: null

			// Проверяем что получили валидный ответ
			if (!geminiResult) {
				await bot.sendMessage(chatId, MessageFormatter.ERRORS.UNAVAILABLE)
				return
			}

			// Обрабатываем ответ от Gemini
			if (typeof geminiResult === 'string') {
				await bot.sendMessage(chatId, geminiResult)
				return
			}

			const geminiResponse = geminiResult as AudioTranscriptionResponse

			// Формируем ответ пользователю
			const formattedResponse = await this.processGeminiResponse(geminiResponse, chatId, userId, isGroup, members)

			await bot.sendMessage(chatId, formattedResponse, {
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

			// Очищаем файлы
			this.cleanupFiles(oggPath, mp3Path)
		} catch (error) {
			console.error('Error processing voice message:', error)

			// Ставим реакцию ошибки при неудачной обработке
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '💔' }],
					is_big: false,
				})
			} catch (reactionError) {
				console.warn(MessageFormatter.ERRORS.GENERAL, reactionError)
			}

			this.handleVoiceError(bot, chatId, error, oggPath, mp3Path)
		}
	}

	// Обработка ответа от Gemini
	private async processGeminiResponse(
		geminiResponse: AudioTranscriptionResponse,
		chatId: string,
		userId: string,
		isGroup: boolean,
		members: GeminiChatMember[]
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
			formattedResponse.push(await this.processTaskOperations(geminiResponse.taskOperations))
		}

		// Если ничего не было сделано, выводим стандартное сообщение
		if (formattedResponse.length === 0) {
			return 'Задач не обнаружено 🤷‍♂️'
		}

		return formattedResponse.join('\n\n')
	}



	private async processTasksCreation(tasks: Task[], userId: string, chatId: string, isGroup: boolean): Promise<string> {
		const result = [MessageFormatter.SUCCESS.NEW_TASKS(tasks.length)]
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

	// Обработка операций с задачами
	private async processTaskOperations(operations: TaskOperation[]): Promise<string> {
		const response = []

		for (const operation of operations) {
			try {
				const task = await this.taskService.getTaskById(operation.taskId)
				if (!task) continue

				switch (operation.operation) {
					case 'delete':
						const deleteSuccess = await this.taskService.deleteTask(task.id)
						response.push(OperationFormatter.formatTaskOperation(operation, deleteSuccess, task))
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
							response.push(OperationFormatter.formatTaskOperation(operation, !!updatedTask, task))
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



	// Очистка файлов
	private cleanupFiles(oggPath: string, mp3Path: string): void {
		if (fs.existsSync(oggPath)) {
			fs.unlinkSync(oggPath)
		}
		if (fs.existsSync(mp3Path)) {
			fs.unlinkSync(mp3Path)
		}
	}

	// Обработка ошибок
	private handleVoiceError(bot: TelegramBot, chatId: string, error: any, oggPath: string, mp3Path: string): void {
		let errorMessage = 'Unknown error occurred'
		let isProxyError = false

		if (error instanceof Error) {
			errorMessage = error.message

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

		let userMessage = `Error processing voice message: ${errorMessage}`

		if (isProxyError) {
			userMessage +=
				'\n\nNote: There may be connectivity issues. The system will retry with direct connection if available.'
		}

		bot.sendMessage(chatId, userMessage)

		// Очищаем файлы при ошибке
		try {
			this.cleanupFiles(oggPath, mp3Path)
		} catch (cleanupError) {
			console.warn('Error during cleanup:', cleanupError)
		}
	}
}
