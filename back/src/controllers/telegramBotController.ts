import TelegramBot from 'node-telegram-bot-api'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { GeminiService } from '../services/geminiService'
import { TaskService } from '../services/taskService'
import { ChatService } from '../services/chatService'

// Контроллер для Telegram бота
class TelegramBotController {
	private bot?: TelegramBot
	private token: string
	private geminiService?: GeminiService
	private taskService: TaskService
	private chatService: ChatService

	// Функция для перевода приоритета на русский
	private translatePriority(priority: 'high' | 'medium' | 'low'): string {
		switch (priority) {
			case 'high': return 'высокий'
			case 'medium': return 'средний'
			case 'low': return 'низкий'
			default: return priority
		}
	}

	constructor(taskService: TaskService, chatService: ChatService) {
		this.taskService = taskService
		this.chatService = chatService
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
		
		// Обработка изменения статуса бота в чате (например, получение прав администратора)
		this.bot.on('my_chat_member', async update => {
			const chatId = update.chat.id.toString()
			const newStatus = update.new_chat_member.status
			const oldStatus = update.old_chat_member.status
			
			console.log(`Bot status changed in chat ${chatId}: ${oldStatus} -> ${newStatus}`)
			
			// Проверяем, стал ли бот администратором
			if (newStatus === 'administrator' && oldStatus !== 'administrator') {
				try {
					// Получаем ID сообщения с предупреждением
					const warningMessageId = await this.chatService.getWarningMessageId(chatId)
					
					// Если есть предупреждение, удаляем его
					if (warningMessageId) {
						try {
							await this.bot!.deleteMessage(chatId, warningMessageId)
							console.log('Предупреждение о правах удалено')
							// Очищаем ID предупреждения в БД
							await this.chatService.updateWarningMessageId(chatId, 0)
						} catch (deleteError) {
							console.warn('Не удалось удалить предупреждение:', deleteError)
						}
					}
					
					// Получаем ID приветственного сообщения
					const welcomeMessageId = await this.chatService.getWelcomeMessageId(chatId)
					
					// Если есть приветственное сообщение, пытаемся его закрепить
					if (welcomeMessageId) {
						try {
							await this.bot!.pinChatMessage(chatId, welcomeMessageId)
							console.log('Приветственное сообщение закреплено после получения прав администратора')
							
							// Отправляем уведомление об успешном закреплении
							await this.bot!.sendMessage(chatId, '✅ Бот получил права администратора! Приветственное сообщение закреплено.')
						} catch (pinError) {
							console.warn('Не удалось закрепить приветственное сообщение:', pinError)
						}
					}
					
				} catch (error) {
					console.error('Ошибка обработки изменения статуса бота:', error)
				}
			}
		})
		
		// Обработка добавления бота в группу
		this.bot.on('new_chat_members', async msg => {
			const chatId = msg.chat.id.toString()
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
			
			if (!isGroup) return
			
			// Проверяем, был ли добавлен наш бот
			const botAdded = msg.new_chat_members?.some(member => member.is_bot)
			
			if (botAdded) {
				try {
					// Создаем или получаем группу в БД
					const chat = await this.chatService.getOrCreateChat(chatId, msg.chat.title || 'Unknown Group', msg.chat.username)
					
					// Отправляем приветственное сообщение с кнопкой регистрации
					const welcomeMessage = `🎉 Привет! Я бот для управления задачами в группах!\n\n` +
						`Чтобы начать использовать все возможности бота, каждый участник должен зарегистрироваться.\n\n` +
						`Зарегистрируйтесь, нажав кнопку ниже:`
					
					const registerKeyboard = {
						inline_keyboard: [
							[{ text: '📝 Зарегистрироваться', callback_data: 'register' }]
						]
					}
					
					const sentMessage = await this.bot!.sendMessage(chatId, welcomeMessage, {
						reply_markup: registerKeyboard
					})
					
					// Сохраняем ID приветственного сообщения
					await this.chatService.updateWelcomeMessageId(chatId, sentMessage.message_id)
					
					// Пытаемся закрепить сообщение (если есть права)
					try {
						await this.bot!.pinChatMessage(chatId, sentMessage.message_id)
						console.log('Приветственное сообщение закреплено')
					} catch (pinError) {
						console.warn('Не удалось закрепить сообщение (нет прав администратора):', pinError)
						// Отправляем дополнительное сообщение с инструкцией
						const instructionMessage = `💡 *Важно для администраторов группы:*\n` +
							`Чтобы бот мог закреплять важные сообщения, дайте ему права администратора с возможностью "Закреплять сообщения".\n\n` +
							`Пока что регистрация доступна через команду \`/register\` или кнопку выше.`
						
						try {
							const warningMessage = await this.bot!.sendMessage(chatId, instructionMessage, { parse_mode: 'Markdown' })
							// Сохраняем ID сообщения с предупреждением
							await this.chatService.updateWarningMessageId(chatId, warningMessage.message_id)
						} catch (instructionError) {
							console.warn('Не удалось отправить инструкцию:', instructionError)
						}
					}
					
				} catch (error) {
					console.error('Ошибка обработки добавления бота в группу:', error)
				}
			}
		})
		this.bot.on('callback_query', async query => {
			if (query.data === 'register') {
				const chatId = query.message?.chat.id?.toString()
				const userId = query.from.id.toString()
				const username = query.from.username || 'unknown'
				const firstName = query.from.first_name
				const lastName = query.from.last_name
				
				if (!chatId) return
				
				try {
					// Получаем или создаем чат в базе данных
					const chat = await this.chatService.getOrCreateChat(chatId, query.message?.chat.title || 'Unknown Group', query.message?.chat.username)
					
					// Регистрируем участника с ID чата из базы данных
					const member = await this.chatService.registerMember(chatId, userId, username, firstName, lastName)
					
					// Отвечаем на callback
					await this.bot!.answerCallbackQuery(query.id, {
						text: '✅ Вы успешно зарегистрированы!',
						show_alert: true
					})
					
					// Обновляем сообщение для пользователя
					const successMessage = `✅ ${firstName || username} успешно зарегистрирован в группе!\n\nТеперь вы можете:\n• Добавлять задачи командой /add\n• Просматривать задачи командой /tasks\n• Отправлять голосовые сообщения для извлечения задач`
					
					await this.bot!.sendMessage(chatId, successMessage, { reply_to_message_id: query.message?.message_id })
					
				} catch (error) {
					console.error('Ошибка регистрации участника:', error)
					await this.bot!.answerCallbackQuery(query.id, {
						text: '❌ Ошибка регистрации. Попробуйте еще раз.',
						show_alert: true
					})
				}
			}
		})
		
		// Обработка команды /start
		this.bot.onText(/\/start/, msg => {
			const chatId = msg.chat.id.toString()
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
			
			if (isGroup) {
				this.sendMessage(chatId, 'Привет! Я бот для управления задачами в группах. Используйте:\n/register - зарегистрироваться в группе\n/tasks - показать задачи группы\n/members - показать зарегистрированных участников\n/pin_welcome - закрепить приветственное сообщение (для админов)\n/add [задача] - добавить задачу в группу\n/assign [id] @[username] - назначить задачу участнику\n/complete [id] - отметить задачу как выполненную\nОтправьте голосовое сообщение для извлечения задач')
			} else {
				this.sendMessage(chatId, 'Привет! Я бот для управления задачами. Отправь голосовое сообщение, чтобы извлечь задачи, или используй команды:\n/tasks - показать все задачи\n/add [задача] - добавить задачу\n/delete [id] - удалить задачу')
			}
		})

		// Обработка команды /help
		this.bot.onText(/\/help/, msg => {
			const chatId = msg.chat.id.toString()
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
			
			if (isGroup) {
				this.sendMessage(
					chatId,
					'Доступные команды в группе:\n/start - Запуск бота\n/help - Помощь\n/register - Зарегистрироваться в группе\n/tasks - Показать задачи группы\n/members - Показать зарегистрированных участников\n/pin_welcome - Закрепить приветственное сообщение (только для админов)\n/add [задача] - Добавить задачу в группу\n/assign [id] @[username] - Назначить задачу участнику\n/complete [id] - Отметить задачу как выполненную\n/delete [id] - Удалить задачу\nОтправьте голосовое сообщение для извлечения задач'
				)
			} else {
				this.sendMessage(
					chatId,
					'Доступные команды:\n/start - Запуск бота\n/help - Помощь\n/tasks - Показать все задачи\n/add [задача] - Добавить задачу\n/delete [id] - Удалить задачу\nОтправь голосовое сообщение для извлечения задач из аудио'
				)
			}
		})

		// Обработка команды /members
		this.bot.onText(/\/members/, async msg => {
			const chatId = msg.chat.id.toString()
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

			if (!isGroup) {
				this.sendMessage(chatId, 'Команда /members доступна только в группах')
				return
			}

			try {
				// Получаем чат из базы данных
				const chat = await this.chatService.getOrCreateChat(chatId, msg.chat.title || 'Unknown Group', msg.chat.username)
				const members = await this.chatService.getChatMembers(chatId)
				
				if (members.length === 0) {
					this.sendMessage(chatId, 'В группе нет зарегистрированных участников')
				} else {
					let response = `👥 Зарегистрированные участники (${members.length}):\n\n`
					members.forEach((member: any, index: number) => {
						const name = member.firstName || member.username || 'Неизвестный'
						response += `${index + 1}. ${name}`
						if (member.username) {
							response += ` (@${member.username})`
						}
						response += `\n`
					})
					this.sendMessage(chatId, response)
				}
			} catch (error) {
				console.error('Ошибка получения списка участников:', error)
				this.sendMessage(chatId, 'Ошибка получения списка участников')
			}
		})

		// Обработка команды /pin_welcome
		this.bot.onText(/\/pin_welcome/, async msg => {
			const chatId = msg.chat.id.toString()
			const userId = msg.from!.id
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

			if (!isGroup) {
				this.sendMessage(chatId, 'Команда /pin_welcome доступна только в группах')
				return
			}

			try {
				// Проверяем, является ли пользователь администратором
				const chatMember = await this.bot!.getChatMember(chatId, userId)
				const isAdmin = ['administrator', 'creator'].includes(chatMember.status)

				if (!isAdmin) {
					this.sendMessage(chatId, '❌ Только администраторы группы могут использовать эту команду')
					return
				}

				// Отправляем новое приветственное сообщение
				const welcomeMessage = `🎉 Привет! Я бот для управления задачами в группах!\n\n` +
					`Чтобы начать использовать все возможности бота, каждый участник должен зарегистрироваться.\n\n` +
					`Зарегистрируйтесь, нажав кнопку ниже:`

				const registerKeyboard = {
					inline_keyboard: [
						[{ text: '📝 Зарегистрироваться', callback_data: 'register' }]
					]
				}

				const sentMessage = await this.bot!.sendMessage(chatId, welcomeMessage, {
					reply_markup: registerKeyboard
				})

				// Закрепляем сообщение
				await this.bot!.pinChatMessage(chatId, sentMessage.message_id)
				this.sendMessage(chatId, '✅ Приветственное сообщение закреплено!')

			} catch (error) {
				console.error('Ошибка закрепления приветственного сообщения:', error)
				this.sendMessage(chatId, '❌ Ошибка закрепления сообщения. Возможно, у бота нет прав администратора.')
			}
		})

		// Обработка команды /tasks
		this.bot.onText(/\/tasks/, async msg => {
			const chatId = msg.chat.id.toString()
			const userId = msg.from!.id.toString()
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

			try {
				let tasks
				if (isGroup) {
					// Получаем чат из базы данных для получения его ID
					const chat = await this.chatService.getOrCreateChat(chatId, msg.chat.title || 'Unknown Group', msg.chat.username)
					tasks = await this.taskService.getTasksByChat(chatId)
				} else {
					tasks = await this.taskService.getPersonalTasks(userId)
				}

				if (tasks.length === 0) {
					this.sendMessage(chatId, 'У вас нет задач')
				} else {
					let response = isGroup ? 'Задачи группы:\n' : 'Ваши задачи:\n'
					tasks.forEach((task, index) => {
						response += `\n${index + 1}. ${task.title}\n`
						response += `   Описание: ${task.description}\n`
						response += `   Приоритет: ${this.translatePriority(task.priority)}\n`
						if (task.deadline) {
							response += `   Срок: ${task.deadline}\n`
						}
						if (isGroup && task.assignedToUserId) {
							response += `   Назначена: @${task.assignedToUserId}\n`
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
			const chatId = msg.chat.id.toString()
			const userId = msg.from!.id.toString()
			const taskText = msg.text!.replace('/add ', '')
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

			try {
				if (isGroup) {
					// Получаем чат из базы данных для получения его ID
					const chat = await this.chatService.getOrCreateChat(chatId, msg.chat.title || 'Unknown Group', msg.chat.username)
					await this.taskService.createGroupTask({
						title: taskText,
						description: taskText,
						priority: 'medium',
						deadline: null,
						userId,
						chatId: chatId
					})
				} else {
					await this.taskService.createPersonalTask({
						title: taskText,
						description: taskText,
						priority: 'medium',
						deadline: null,
						userId
					})
				}
				this.sendMessage(chatId, `Задача "${taskText}" добавлена`)
			} catch (error) {
				console.error('Ошибка добавления задачи:', error)
				this.sendMessage(chatId, 'Ошибка добавления задачи')
			}
		})

		// Обработка команды /delete
		this.bot.onText(/\/delete (\d+)/, async msg => {
			const chatId = msg.chat.id.toString()
			const userId = msg.from!.id.toString()
			const taskId = parseInt(msg.text!.replace('/delete ', ''))
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

			try {
				let deleted
				if (isGroup) {
					// В группах удаляем задачу без проверки пользователя (групповую задачу)
					deleted = await this.taskService.deleteGroupTask(taskId)
				} else {
					// В личных чатах удаляем задачу пользователя
					deleted = await this.taskService.deleteTask(taskId, userId)
				}

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

		// Обработка команды /assign
		this.bot.onText(/\/assign (\d+) @?(\w+)/, async msg => {
			const chatId = msg.chat.id.toString()
			const userId = msg.from!.id.toString()
			const taskId = parseInt(msg.text!.replace(/\/assign \d+ @?\w+/, '$1'))
			const assigneeUsername = msg.text!.replace(/\/assign \d+ @?/, '')
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

			if (!isGroup) {
				this.sendMessage(chatId, 'Команда /assign доступна только в группах')
				return
			}

			try {
				// Получаем чат из базы данных
				const chat = await this.chatService.getOrCreateChat(chatId, msg.chat.title || 'Unknown Group', msg.chat.username)
				
				// Получаем участников группы
				const members = await this.chatService.getChatMembers(chatId)
				const assignee = members.find((m: any) => m.username === assigneeUsername)

				if (!assignee) {
					this.sendMessage(chatId, `Пользователь @${assigneeUsername} не зарегистрирован в группе`)
					return
				}

				// Назначаем задачу
				const updatedTask = await this.taskService.updateGroupTask(taskId, { assignedToUserId: assignee.userId })

				if (updatedTask) {
					this.sendMessage(chatId, `Задача ${taskId} назначена пользователю @${assigneeUsername}`)
				} else {
					this.sendMessage(chatId, `Задача ${taskId} не найдена`)
				}
			} catch (error) {
				console.error('Ошибка назначения задачи:', error)
				this.sendMessage(chatId, 'Ошибка назначения задачи')
			}
		})

		// Обработка команды /complete
		this.bot.onText(/\/complete (\d+)/, async msg => {
			const chatId = msg.chat.id.toString()
			const userId = msg.from!.id.toString()
			const taskId = parseInt(msg.text!.replace('/complete ', ''))
			const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

			try {
				let updatedTask
				if (isGroup) {
					// В группах проверяем, что задача назначена текущему пользователю
					const task = await this.taskService.getGroupTaskById(taskId)
					if (task && task.assignedToUserId === userId) {
						updatedTask = await this.taskService.updateGroupTask(taskId, { isCompleted: true })
					} else {
						this.sendMessage(chatId, 'Вы можете отмечать как выполненные только задачи, назначенные вам')
						return
					}
				} else {
					updatedTask = await this.taskService.updateTask(taskId, userId, { isCompleted: true })
				}

				if (updatedTask) {
					this.sendMessage(chatId, `✅ Задача ${taskId} отмечена как выполненная`)
				} else {
					this.sendMessage(chatId, `Задача ${taskId} не найдена`)
				}
			} catch (error) {
				console.error('Ошибка отметки задачи как выполненной:', error)
				this.sendMessage(chatId, 'Ошибка отметки задачи как выполненной')
			}
		})

		// Handle voice messages
		this.bot.on('voice', async msg => {
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
								if (isGroup) {
									// Получаем чат из базы данных для получения его ID
									const chat = await this.chatService.getOrCreateChat(chatId, msg.chat.title || 'Unknown Group', msg.chat.username)
									await this.taskService.createGroupTask({
										...task,
										userId: userId,
										chatId: chatId
									})
								} else {
									await this.taskService.createPersonalTask({
										...task,
										userId: userId
									})
								}
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
			const chatId = msg.chat.id.toString()
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
