import TelegramBot from 'node-telegram-bot-api'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { GeminiService } from './geminiService'
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'
import { UserService } from './userService'
import { MessageFormatterService } from './messageFormatterService'
import {
	GeminiUser,
	GeminiRole,
	GeminiTask,
	GeminiChatMember,
	TaskOperation,
	RoleOperation,
	AudioTranscriptionResponse,
	ViewRequest,
} from '../types'

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
		this.ensureDownloadsDirectory()
	}

	// Создание директории для загрузок, если не существует
	private ensureDownloadsDirectory(): void {
		const downloadsDir = path.join(__dirname, '../downloads')
		if (!fs.existsSync(downloadsDir)) {
			fs.mkdirSync(downloadsDir, { recursive: true })
		}
	}

	// Конвертация OGG в MP3
	private async convertOggToMp3(inputPath: string, outputPath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			ffmpeg(inputPath)
				.toFormat('mp3')
				.on('end', () => resolve())
				.on('error', (err: any) => reject(err))
				.save(outputPath)
		})
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
			console.log(`Processing voice message with fileId: ${fileId}`)

			// Ставим реакцию думающего смайлика для индикации обработки
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '🤔' }],
				})
			} catch (reactionError) {
				console.warn('Не удалось поставить реакцию:', reactionError)
				// Продолжаем обработку даже если реакция не сработала
			}

			// Скачиваем файл
			const fileInfo = await bot.getFile(fileId)
			console.log(`File info:`, fileInfo)

			const downloadResult = await bot.downloadFile(fileId, downloadsDir)
			console.log(`Download result type:`, typeof downloadResult)

			let downloadedFilePath: string

			if (typeof downloadResult === 'string') {
				downloadedFilePath = downloadResult
				console.log(`Downloaded to: ${downloadedFilePath}`)
			} else {
				throw new Error('Download returned a stream instead of file path')
			}

			// Переименовываем файл
			if (fs.existsSync(downloadedFilePath)) {
				fs.renameSync(downloadedFilePath, oggPath)
				console.log(`Renamed to: ${oggPath}`)
			} else {
				throw new Error(`Downloaded file not found at ${downloadedFilePath}`)
			}

			if (!fs.existsSync(oggPath)) {
				throw new Error(`OGG file not found at ${oggPath}`)
			}

			// Конвертируем в MP3
			await this.convertOggToMp3(oggPath, mp3Path)

			if (!fs.existsSync(mp3Path)) {
				throw new Error(`MP3 file not created at ${mp3Path}`)
			}

			// Получаем контекст для Gemini (полноценная схема БД)
			let users: GeminiUser[] = []
			let roles: GeminiRole[] = []
			let tasks: GeminiTask[] = []
			let members: GeminiChatMember[] = []
			let currentUserRole: GeminiRole | null = null

			// Создаем объект автора запроса
			const author: GeminiUser = {
				telegramId: userId,
				username: msg.from?.username || userId,
				firstName: msg.from?.first_name || 'Неизвестный',
				lastName: msg.from?.last_name,
			}

			if (isGroup) {
				try {
					// Обеспечиваем существование пользователя и чата
					await this.userService.createOrGetUser({
						telegramId: userId,
						firstName: msg.from?.first_name || 'Неизвестный',
						lastName: msg.from?.last_name,
						username: msg.from?.username || userId,
					})

					await this.chatService.createOrGetChat({
						telegramId: chatId,
						title: msg.chat.title || 'Неизвестный чат',
						username: msg.chat.username,
					})

					// Получаем всех участников с полной информацией
					const chatMembers = await this.chatService.getChatMembers(chatId)

					// Формируем списки для Gemini
					users = chatMembers.map(member => ({
						telegramId: member.user?.telegramId || member.userId,
						username: member.user?.username || '',
						firstName: member.user?.firstName || 'Неизвестный',
						lastName: member.user?.lastName,
					}))

					members = chatMembers.map(member => ({
						userId: member.userId,
						username: member.user?.username || '',
						firstName: member.user?.firstName || 'Неизвестный',
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
						priority: task.priority,
						deadline: task.deadline ? String(task.deadline) : null,
						type: task.type,
						authorId: task.authorId,
						chatId: task.chatId,
						assignedUserId: task.assignedUserId,
						assignedRoleId: task.assignedRoleId,
						isCompleted: task.isCompleted,
					}))

					// Определяем роль текущего пользователя
					const currentMemberRole = await this.chatService.getMemberRole(chatId, userId)
					if (currentMemberRole) {
						currentUserRole = {
							id: currentMemberRole.id,
							name: currentMemberRole.name,
							chatId: currentMemberRole.chatId,
							memberIds: currentMemberRole.members?.map(m => m.userId) || [],
						}
					}
				} catch (error) {
					console.error('Ошибка получения контекста группы:', error)
				}
			} else {
				try {
					// Обеспечиваем существование пользователя
					const user = await this.userService.createOrGetUser({
						telegramId: userId,
						firstName: msg.from?.first_name || 'Неизвестный',
						lastName: msg.from?.last_name,
						username: msg.from?.username || userId,
					})

					users = [
						{
							telegramId: user.telegramId,
							username: user.username,
							firstName: user.firstName,
							lastName: user.lastName,
						},
					]

					// Получаем личные задачи
					const personalTasks = await this.taskService.getPersonalTasks(userId)
					tasks = personalTasks.map(task => ({
						id: task.id,
						readableId: task.readableId,
						title: task.title,
						description: task.description,
						priority: task.priority,
						deadline: task.deadline ? String(task.deadline) : null,
						type: task.type,
						authorId: task.authorId,
						chatId: task.chatId,
						assignedUserId: task.assignedUserId,
						assignedRoleId: task.assignedRoleId,
						isCompleted: task.isCompleted,
					}))
				} catch (error) {
					console.error('Ошибка получения персональных задач:', error)
				}
			}

			const geminiResult = this.geminiService
				? await this.geminiService.processAudio(mp3Path, author, users, tasks, roles)
				: null

			// Проверяем что получили валидный ответ
			if (!geminiResult) {
				await bot.sendMessage(chatId, 'Ошибка: сервис Gemini недоступен')
				return
			}

			if (typeof geminiResult === 'string') {
				await bot.sendMessage(chatId, geminiResult)
				return
			}

			const geminiResponse = geminiResult as AudioTranscriptionResponse

			// Формируем ответ пользователю
			const formattedResponse = await this.processGeminiResponse(geminiResponse, chatId, userId, isGroup, members)

			// Отправляем ответ пользователю
			await bot.sendMessage(chatId, formattedResponse, {
				reply_to_message_id: msg.message_id,
				parse_mode: 'HTML',
			})

			// Ставим реакцию галочки после успешной обработки
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '🍓' }],
					is_big: false,
				})
			} catch (reactionError) {
				console.warn('Не удалось поставить финальную реакцию:', reactionError)
			}

			// Очищаем файлы
			this.cleanupFiles(oggPath, mp3Path)

			console.log(`Voice message processed successfully: ${mp3FileName}`)
		} catch (error) {
			console.error('Error processing voice message:', error)

			// Ставим реакцию ошибки при неудачной обработке
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '💔' }],
					is_big: false,
				})
			} catch (reactionError) {
				console.warn('Не удалось поставить реакцию ошибки:', reactionError)
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

		let formattedResponse = ''

		// Сначала создаем роли
		const createdRoles: { [name: string]: number } = {}
		if (geminiResponse.roles && geminiResponse.roles.length > 0 && isGroup) {
			formattedResponse += 'Создаю роли:\n'
			for (const roleData of geminiResponse.roles) {
				try {
					const role = await this.roleService.createRole({
						name: roleData.name,
						chatId: chatId,
					})
					createdRoles[roleData.name] = role.id
					formattedResponse += `✅ Роль "${roleData.name}" создана\n`
				} catch (dbError) {
					console.error('Ошибка создания роли:', dbError)
					formattedResponse += `❌ Ошибка создания роли "${roleData.name}"\n`
				}
			}
			formattedResponse += '\n'
		}

		// Создаем задачи
		if (geminiResponse.tasks && geminiResponse.tasks.length > 0) {
			formattedResponse += 'Добавлены задачи:\n'

			for (const task of geminiResponse.tasks) {
				try {
					let assignedUserId: string | undefined = undefined
					let assignedRoleId: number | undefined = undefined

					// Используем ID напрямую из ответа Gemini
					if (task.assignedUserId) {
						assignedUserId = task.assignedUserId
					}

					if (task.assignedRoleId) {
						assignedRoleId = task.assignedRoleId
					}

					// Создаем задачу через новый API
					const createdTask = await this.taskService.createTask({
						title: task.title,
						description: task.description,
						priority: task.priority,
						deadline: task.deadline ? new Date(task.deadline) : undefined,
						authorId: userId,
						chatId: isGroup ? chatId : undefined,
						assignedUserId,
						assignedRoleId,
					})

					// Используем полное форматирование задачи
					formattedResponse += MessageFormatterService.formatTask(createdTask) + '\n'
				} catch (dbError) {
					console.error('Ошибка сохранения задачи в БД:', dbError)
					formattedResponse += `❌ Ошибка создания задачи "${task.title}"\n`
				}
			}
		}
		// Обрабатываем операции с задачами
		if (geminiResponse.taskOperations && geminiResponse.taskOperations.length > 0) {
			formattedResponse += '\n🔄 Операции с задачами:\n'
			formattedResponse += await this.processTaskOperations(geminiResponse.taskOperations)
		}

		// Обрабатываем операции с ролями
		if (geminiResponse.roleOperations && geminiResponse.roleOperations.length > 0 && isGroup) {
			formattedResponse += '\n🎭 Операции с ролями:\n'
			formattedResponse += await this.processRoleOperations(geminiResponse.roleOperations, chatId, members)
		}

		// Обрабатываем запросы на просмотр информации
		if (geminiResponse.viewRequests && geminiResponse.viewRequests.length > 0) {
			formattedResponse +=
				(await this.processViewRequests(geminiResponse.viewRequests, chatId, userId, isGroup)) + '\n'
		}

		return formattedResponse
	}

	// Обработка операций с задачами
	private async processTaskOperations(operations: TaskOperation[]): Promise<string> {
		let response = ''

		for (const operation of operations) {
			try {
				// Получаем задачу по ID (теперь числовой)
				const task = await this.taskService.getTaskById(operation.taskId)

				if (!task) {
					response += `❌ Задача #${operation.taskId} не найдена\n`
					continue
				}

				const taskDisplayId = task.readableId

				switch (operation.operation) {
					case 'delete':
						const deleteSuccess = await this.taskService.deleteTask(task.id)
						response += deleteSuccess
							? `✅ Задача ${taskDisplayId} удалена\n`
							: `❌ Не удалось удалить задачу ${taskDisplayId}\n`
						break

					case 'complete':
						const completeTask = await this.taskService.updateTask(task.id, { isCompleted: true })
						response += completeTask
							? `✅ Задача ${taskDisplayId} отмечена как выполненная\n`
							: `❌ Не удалось отметить задачу ${taskDisplayId} как выполненную\n`
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
							response += updatedTask
								? `✅ Задача ${taskDisplayId} обновлена\n`
								: `❌ Не удалось обновить задачу ${taskDisplayId}\n`
						}
						break
				}
			} catch (operationError) {
				console.error('Ошибка при выполнении операции с задачей:', operationError)
				response += `❌ Ошибка при выполнении операции с задачей #${operation.taskId}\n`
			}
		}

		return response
	}

	// Обработка операций с ролями
	private async processRoleOperations(
		operations: RoleOperation[],
		chatId: string,
		members: GeminiChatMember[]
	): Promise<string> {
		let response = ''

		for (const operation of operations) {
			try {
				switch (operation.operation) {
					case 'create':
						if (operation.roleName) {
							try {
								await this.roleService.createRole({
									name: operation.roleName,
									chatId: chatId,
								})
								response += `✅ Роль "${operation.roleName}" создана\n`
							} catch (error) {
								response += `❌ Ошибка создания роли "${operation.roleName}"\n`
							}
						}
						break

					case 'delete':
						if (operation.roleId) {
							const role = await this.roleService.getRoleById(operation.roleId)
							const deleteSuccess = await this.roleService.deleteRole(operation.roleId)
							response += deleteSuccess
								? `✅ Роль "${role?.name}" удалена\n`
								: `❌ Не удалось удалить роль\n`
						}
						break

					case 'update':
						if (operation.roleId && operation.newRoleName) {
							const updatedRole = await this.roleService.updateRole(operation.roleId, {
								name: operation.newRoleName,
							})
							response += updatedRole
								? `✅ Роль переименована в "${operation.newRoleName}"\n`
								: `❌ Не удалось переименовать роль\n`
						}
						break

					case 'assign':
						if (operation.targetUserId) {
							let roleId = operation.roleId
							if (!roleId && operation.roleName) {
								const roles = await this.roleService.getChatRoles(chatId)
								const role = roles.find(r => r.name === operation.roleName)
								roleId = role?.id
							}

							if (!roleId) break
							const success = await this.roleService.assignRoleToMember(
								chatId,
								operation.targetUserId,
								roleId
							)
							const targetUser = await this.userService.getUserById(operation.targetUserId)

							if (!targetUser) break
							response += success
								? `✅ Роль назначена пользователю ${MessageFormatterService.getTag(targetUser)}\n`
								: `❌ Не удалось назначить роль пользователю ${MessageFormatterService.getTag(targetUser)}\n`
						}
						break

					case 'unassign':
						if (operation.targetUserId) {
							const success = await this.roleService.removeRoleFromMember(chatId, operation.targetUserId)
							const targetUser = members.find(m => m.userId === operation.targetUserId)
							const userName = targetUser
								? targetUser.firstName || targetUser.username
								: operation.targetUserId
							response += success
								? `✅ Роль снята с пользователя ${userName}\n`
								: `❌ Не удалось снять роль с пользователя ${userName}\n`
						}
						break
				}
			} catch (operationError) {
				console.error('Ошибка при выполнении операции с ролью:', operationError)
				response += `❌ Ошибка при выполнении операции с ролью\n`
			}
		}

		return response
	}

	// Обработка запросов на просмотр информации
	private async processViewRequests(
		requests: ViewRequest[],
		chatId: string,
		userId: string,
		isGroup: boolean
	): Promise<string> {
		let response = ''

		for (const request of requests) {
			try {
				switch (request.type) {
					case 'tasks':
						if (isGroup) {
							const tasks = await this.taskService.getGroupTasks(chatId)
							response += MessageFormatterService.formatTasksList(tasks) + '\n'
						} else {
							const tasks = await this.taskService.getPersonalTasks(userId)
							response += MessageFormatterService.formatTasksList(tasks) + '\n'
						}
						break

					case 'members':
						if (isGroup) {
							const chatMembers = await this.chatService.getChatMembers(chatId)
							response += MessageFormatterService.formatMembersList(chatMembers) + '\n'
						} else {
							response += '❌ Команда показа участников доступна только в группах\n'
						}
						break

					case 'roles':
						if (isGroup) {
							const roles = await this.roleService.getChatRoles(chatId)
							response += MessageFormatterService.formatRolesList(roles) + '\n'
						} else {
							response += '❌ Команда показа ролей доступна только в группах\n'
						}
						break

					case 'userTasks':
						if (isGroup) {
							const tasks = await this.taskService.getAssignedTasks(userId, chatId)
							response += MessageFormatterService.formatTasksList(tasks) + '\n'
						} else {
							const tasks = await this.taskService.getPersonalTasks(userId)
							response += MessageFormatterService.formatTasksList(tasks) + '\n'
						}
						break

					default:
						response += `❌ Неизвестный тип запроса: ${request.type}\n`
				}
			} catch (error) {
				console.error(`Ошибка при обработке запроса ${request.type}:`, error)
				response += `❌ Ошибка при получении информации ${request.type}\n`
			}
		}

		return response
	}

	// Очистка файлов
	private cleanupFiles(oggPath: string, mp3Path: string): void {
		if (fs.existsSync(oggPath)) {
			fs.unlinkSync(oggPath)
			console.log(`Cleaned up OGG file: ${oggPath}`)
		}
		if (fs.existsSync(mp3Path)) {
			fs.unlinkSync(mp3Path)
			console.log(`Cleaned up MP3 file: ${mp3Path}`)
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
