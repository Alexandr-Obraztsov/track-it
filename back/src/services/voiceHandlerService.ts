import TelegramBot from 'node-telegram-bot-api'
import { GeminiService } from './geminiService'
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'
import { UserService } from './userService'
import { Formatter } from './formatter/formatter'
import path from 'path'
import {
	GeminiUser,
	GeminiRole,
	GeminiTask,
	GeminiChatMember,
	TaskOperation,
	RoleOperation,
	AudioTranscriptionResponse,
	ViewRequest,
	Role,
	Task,
} from '../types'
import { convertOggToMp3, ensureDownloadsDirectory } from '../utils/fileUtils'
import * as fs from 'fs'
import { RoleEntity } from '../entities/Role'

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
				console.warn('Не удалось поставить реакцию:', reactionError)
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

					users = [user]

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
				console.warn('Не удалось поставить финальную реакцию:', reactionError)
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

		const formattedResponse = []

		// Сначала создаем роли
		if (geminiResponse.roles && geminiResponse.roles.length > 0 && isGroup) {
			formattedResponse.push(await this.processRolesCreation(geminiResponse.roles, chatId))
		}

		// Создаем задачи
		if (geminiResponse.tasks && geminiResponse.tasks.length > 0) {
			formattedResponse.push(await this.processTasksCreation(geminiResponse.tasks, userId, chatId, isGroup))
		}

		// Обрабатываем операции с ролями
		if (geminiResponse.roleOperations && geminiResponse.roleOperations.length > 0 && isGroup) {
			formattedResponse.push(await this.processRoleOperations(geminiResponse.roleOperations, chatId))
		}

		// Обрабатываем операции с задачами
		if (geminiResponse.taskOperations && geminiResponse.taskOperations.length > 0) {
			formattedResponse.push(await this.processTaskOperations(geminiResponse.taskOperations))
		}

		// Обрабатываем запросы на просмотр информации
		if (geminiResponse.viewRequests && geminiResponse.viewRequests.length > 0) {
			formattedResponse.push(await this.processViewRequests(geminiResponse.viewRequests, chatId, userId, isGroup))
		}

		return formattedResponse.join('\n\n')
	}


	private async processRolesCreation(roles: Role[], chatId: string): Promise<string> {
		const result = []
		for (const roleData of roles) {
			let role: RoleEntity | undefined
			try {
				role = await this.roleService.createRole({
					name: roleData.name,
					chatId,
				})
			} catch (dbError) {
				console.error('Ошибка создания роли:', dbError)
			}

			const success = !!role
			result.push(
				Formatter.formatRoleOperation(
					{
						operation: 'create',
						roleName: roleData.name,
					},
					success,role
				)
			)
		}
		return result.join('\n')
	}

	private async processTasksCreation(tasks: Task[], userId: string, chatId: string, isGroup: boolean): Promise<string> {
		const result = ["Новые задачи:"]
		for (const task of tasks) {
				try {
					// Создаем задачу через новый API
					const createdTask = await this.taskService.createTask({
						title: task.title,
						description: task.description,
						priority: task.priority,
						deadline: task.deadline ? new Date(task.deadline) : undefined,
						authorId: userId,
						chatId: isGroup ? chatId : undefined,
						assignedUserId: task.assignedUserId ?? undefined,
						assignedRoleId: task.assignedRoleId ?? undefined,
					})

					// Используем полное форматирование задачи
					result.push(Formatter.formatTask(createdTask))
				} catch (dbError) {
					console.error('Ошибка сохранения задачи в БД:', dbError)
					result.push(`❌ Ошибка создания задачи "${task.title}"\n`)
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
						response.push(Formatter.formatTaskOperation(operation, deleteSuccess, task))

					case 'update':
						if (operation.updateData) {
							const updateData = {
								...operation.updateData,
								deadline: operation.updateData.deadline
									? new Date(operation.updateData.deadline)
									: undefined,
							}

							const updatedTask = await this.taskService.updateTask(task.id, updateData)
							response.push(Formatter.formatTaskOperation(operation, !!updatedTask, task))
						}
						break
				}
			} catch (operationError) {
				console.error('Ошибка при выполнении операции с задачей:', operationError)
				response.push(`❌ Ошибка при выполнении операции с задачей #${operation.taskId}\n`)
			}
		}

		return response.join('\n')
	}

	private async processRoleOperations(
		operations: RoleOperation[],
		chatId: string,
	): Promise<string> {
		const response = []

		for (const operation of operations) {
			try {
				switch (operation.operation) {
					case 'create':
						if (operation.roleName) {
							let role: RoleEntity | undefined
							try {
								role = await this.roleService.createRole({
									name: operation.roleName,
									chatId: chatId,
								})
							} catch (error) {
								console.error('Ошибка создания роли:', error)
							}
							const success = !!role
							response.push(
								Formatter.formatRoleOperation(
									operation,
									success,
									role
								)
							)
						}
						break

					case 'delete':
						if (operation.roleId) {
							const role = await this.roleService.getRoleById(operation.roleId)
							const deleteSuccess = await this.roleService.deleteRole(operation.roleId)
							response.push(Formatter.formatRoleOperation(
								operation,
								deleteSuccess,
								role ?? undefined
							))
						}
						break

					case 'update':
						if (operation.roleId && operation.newRoleName) {
							const role = await this.roleService.getRoleById(operation.roleId)
							const updatedRole = await this.roleService.updateRole(operation.roleId, {
								name: operation.newRoleName,
							})
							response.push(Formatter.formatRoleOperation(
								operation,
								!!updatedRole,
								role ?? undefined
							))
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
							const role = await this.roleService.getRoleById(roleId)
							const success = await this.roleService.assignRoleToMember(
								chatId,
								operation.targetUserId,
								roleId
							)
							const targetUser = await this.userService.getUserById(operation.targetUserId)

							if (!targetUser) break
							response.push(Formatter.formatRoleOperation(
								{...operation, targetUser},
								success,
								role ?? undefined
							))
						}
						break

					case 'unassign':
						if (operation.targetUserId) {
							const role = await this.roleService.getRoleById(operation.roleId!)
							const success = await this.roleService.removeRoleFromMember(chatId, operation.targetUserId)
							const targetUser = await this.userService.getUserById(operation.targetUserId)
							if (!targetUser) break
							response.push(Formatter.formatRoleOperation(
								{...operation, targetUser},
								success,
								role ?? undefined
							))
						}
						break
				}
			} catch (operationError) {
				console.error('Ошибка при выполнении операции с ролью:', operationError)
				response.push(`❌ Ошибка при выполнении операции с ролью "${operation.roleName ?? operation.roleId}"`)
			}
		}

		return response.join('\n')
	}

	// Обработка запросов на просмотр информации
	private async processViewRequests(
		requests: ViewRequest[],
		chatId: string,
		userId: string,
		isGroup: boolean
	): Promise<string> {
		const response = []

		for (const request of requests) {
			try {
				switch (request.type) {
					case 'tasks':
						if (isGroup) {
							const tasks = await this.taskService.getGroupTasks(chatId)
							response.push(Formatter.formatTasksList(tasks))
						} else {
							const tasks = await this.taskService.getPersonalTasks(userId)
							response.push(Formatter.formatTasksList(tasks))
						}
						break

					case 'members':
						if (isGroup) {
							const chatMembers = await this.chatService.getChatMembers(chatId)
							response.push(Formatter.formatMembersList(chatMembers))
						} else {
							response.push('❌ Команда показа участников доступна только в группах')
						}
						break

					case 'roles':
						if (isGroup) {
							const roles = await this.roleService.getChatRoles(chatId)
							response.push(Formatter.formatRolesList(roles))
						} else {
							response.push('❌ Команда показа ролей доступна только в группах')
						}
						break

					case 'userTasks':
						if (isGroup) {
							const tasks = await this.taskService.getAssignedTasks(userId, chatId)
							response.push(Formatter.formatTasksList(tasks))
						} else {
							const tasks = await this.taskService.getPersonalTasks(userId)
							response.push(Formatter.formatTasksList(tasks))
						}
						break

					default:
						response.push(`❌ Неизвестный тип запроса: ${request.type}`)
				}
			} catch (error) {
				console.error(`Ошибка при обработке запроса ${request.type}:`, error)
				response.push(`❌ Ошибка при получении информации ${request.type}`)
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
