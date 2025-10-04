import { Router, Request, Response } from 'express'
import { userService } from '../server'
import { CreateUserDto, UpdateUserDto } from '../services/userService'

const router: Router = Router()

// GET /api/users - получить всех пользователей
router.get('/', async (req: Request, res: Response) => {
	try {
		const users = await userService.getAllUsers()
		
		res.json({
			success: true,
			data: users,
			count: users.length
		})
	} catch (error) {
		console.error('Ошибка получения пользователей:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения пользователей'
		})
	}
})

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const id = req.params.id
		const user = await userService.getUserById(id)
		
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'Пользователь не найден'
			})
		}
		
		res.json({
			success: true,
			data: user
		})
	} catch (error) {
		console.error('Ошибка получения пользователя:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения пользователя'
		})
	}
})

// POST /api/users - создать нового пользователя
router.post('/', async (req: Request, res: Response) => {
	try {
		const { telegramId, firstName, lastName, username } = req.body
		
		if (!telegramId || !firstName) {
			return res.status(400).json({
				success: false,
				error: 'TelegramId и firstName обязательны'
			})
		}
		
		const user = await userService.createUser({
			telegramId: telegramId.toString(),
			firstName,
			lastName,
			username
		})
		
		res.status(201).json({
			success: true,
			data: user
		})
	} catch (error) {
		console.error('Ошибка создания пользователя:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка создания пользователя'
		})
	}
})

// PUT /api/users/:id - обновить пользователя
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const id = req.params.id
		const updateData = req.body
		
		const user = await userService.updateUser(id, updateData)
		
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'Пользователь не найден'
			})
		}
		
		res.json({
			success: true,
			data: user
		})
	} catch (error) {
		console.error('Ошибка обновления пользователя:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка обновления пользователя'
		})
	}
})

// DELETE /api/users/:id - удалить пользователя
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const id = req.params.id
		const success = await userService.deleteUser(id)
		
		if (!success) {
			return res.status(404).json({
				success: false,
				error: 'Пользователь не найден'
			})
		}
		
		res.json({
			success: true,
			message: 'Пользователь удален'
		})
	} catch (error) {
		console.error('Ошибка удаления пользователя:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка удаления пользователя'
		})
	}
})

// GET /api/users/:id/tasks - получить задачи пользователя
router.get('/:id/tasks', async (req: Request, res: Response) => {
	try {
		const userId = req.params.id
		const { chatId } = req.query
		
		let tasks
		if (chatId) {
			tasks = await userService.getUserAssignedTasks(userId, chatId as string)
		} else {
			tasks = await userService.getUserPersonalTasks(userId)
		}
		
		res.json({
			success: true,
			data: tasks,
			count: tasks.length
		})
	} catch (error) {
		console.error('Ошибка получения задач пользователя:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения задач пользователя'
		})
	}
})

// GET /api/users/:id/chats - получить чаты пользователя
router.get('/:id/chats', async (req: Request, res: Response) => {
	try {
		const userId = req.params.id
		const chats = await userService.getUserChats(userId)
		
		res.json({
			success: true,
			data: chats,
			count: chats.length
		})
	} catch (error) {
		console.error('Ошибка получения чатов пользователя:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения чатов пользователя'
		})
	}
})

export default router
