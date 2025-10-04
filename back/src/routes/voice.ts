import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { geminiService, taskService, userService } from '../server'
import { ensureDownloadsDirectory, convertOggToMp3 } from '../utils/fileUtils'
import * as fs from 'fs'
import { AudioTranscriptionResponse } from '../types'

const router: Router = Router()

// Настройка multer для загрузки аудио файлов
ensureDownloadsDirectory()
const upload = multer({
	dest: path.join(process.cwd(), 'src', 'downloads'),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
	},
	fileFilter: (req, file, cb) => {
		const allowedTypes = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/mpeg']
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true)
		} else {
			cb(new Error('Invalid file type. Only audio files are allowed.'))
		}
	},
})

// POST /api/voice/process - обработка голосового сообщения
router.post('/process', upload.single('audio'), async (req: Request, res: Response) => {
	let oggPath: string | undefined
	let mp3Path: string | undefined

	try {
		const file = req.file
		const userId = req.body.userId // telegramId пользователя

		if (!file) {
			return res.status(400).json({
				success: false,
				error: 'Аудио файл не предоставлен',
			})
		}

		if (!userId) {
			return res.status(400).json({
				success: false,
				error: 'userId обязателен',
			})
		}

		// Проверяем существование пользователя
		const user = await userService.getUserById(userId)
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'Пользователь не найден',
			})
		}

		oggPath = file.path
		mp3Path = oggPath.replace(/\.\w+$/, '.mp3')

		// Конвертируем в mp3
		await convertOggToMp3(oggPath, mp3Path)

		// Получаем личные задачи пользователя
		const userTasks = await taskService.getPersonalTasks(userId)

		// Формируем контекст для Gemini (личные задачи)
		const geminiTasks = userTasks.map(task => ({
			id: task.id,
			title: task.title,
			description: task.description,
			deadline: task.deadline ? task.deadline.toISOString() : null,
			isCompleted: task.isCompleted,
			readableId: task.readableId,
			type: task.type as 'personal' | 'group',
			chatId: task.chatId,
			assignedUserId: task.assignedUserId,
			assignedRoleId: task.assignedRoleId,
		}))

		const author = {
			telegramId: user.telegramId,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
		}

		// Обрабатываем через Gemini (личный ассистент)
		const geminiResult = await geminiService.processMessage(
			mp3Path,
			author,
			geminiTasks,
			[], // Нет ролей для личных задач
			[], // Нет участников чата
			false, // Не групповой чат
			true // Аудио файл
		)

		// Проверяем результат
		if (!geminiResult || typeof geminiResult === 'string') {
			return res.status(200).json({
				success: true,
				message: typeof geminiResult === 'string' ? geminiResult : 'Не удалось обработать запрос',
				tasks: [],
			})
		}

		const geminiResponse = geminiResult as AudioTranscriptionResponse

		// Обрабатываем ответ и выполняем операции с задачами
		const createdTasks: any[] = []
		const updatedTasks: any[] = []
		const deletedTasks: number[] = []

		// Создаем новые задачи
		if (geminiResponse.tasks && geminiResponse.tasks.length > 0) {
			for (const taskData of geminiResponse.tasks) {
				try {
					const newTask = await taskService.createTask({
						title: taskData.title,
						description: taskData.description || undefined,
						deadline: taskData.deadline ? new Date(taskData.deadline) : undefined,
						type: 'personal',
						assignedUserId: userId,
					})
					createdTasks.push({
						id: newTask.id,
						title: newTask.title,
						description: newTask.description,
						deadline: newTask.deadline?.toISOString(),
						isCompleted: newTask.isCompleted,
					})
				} catch (error) {
					console.error('Error creating task:', error)
				}
			}
		}

		// Выполняем операции с существующими задачами
		if (geminiResponse.taskOperations && geminiResponse.taskOperations.length > 0) {
			for (const operation of geminiResponse.taskOperations) {
				try {
					if (operation.operation === 'delete') {
						await taskService.deleteTask(operation.taskId)
						deletedTasks.push(operation.taskId)
					} else if (operation.operation === 'update' && operation.updateData) {
						const updated = await taskService.updateTask(operation.taskId, operation.updateData)
						if (updated) {
							updatedTasks.push({
								id: updated.id,
								title: updated.title,
								description: updated.description,
								deadline: updated.deadline?.toISOString(),
								isCompleted: updated.isCompleted,
							})
						}
					}
				} catch (error) {
					console.error('Error processing task operation:', error)
				}
			}
		}

		// Формируем ответ
		const response = {
			success: true,
			message: geminiResponse.customMessage || 'Задачи обработаны',
			tasks: {
				created: createdTasks,
				updated: updatedTasks,
				deleted: deletedTasks,
			},
		}

		res.json(response)
	} catch (error) {
		console.error('Error processing voice message:', error)
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка обработки голосового сообщения',
		})
	} finally {
		// Очистка файлов
		if (oggPath && fs.existsSync(oggPath)) {
			fs.unlinkSync(oggPath)
		}
		if (mp3Path && fs.existsSync(mp3Path)) {
			fs.unlinkSync(mp3Path)
		}
	}
})

export default router

