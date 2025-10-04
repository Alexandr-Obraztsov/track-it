import { Router, Request, Response } from 'express'
import { chatService } from '../server'
import { CreateChatDto, UpdateChatDto } from '../services/chatService'

const router: Router = Router()

// GET /api/chats - получить все чаты
router.get('/', async (req: Request, res: Response) => {
	try {
		const chats = await chatService.getAllChats()
		
		res.json({
			success: true,
			data: chats,
			count: chats.length
		})
	} catch (error) {
		console.error('Ошибка получения чатов:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения чатов'
		})
	}
})

// GET /api/chats/:id - получить чат по ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const id = req.params.id
		const chat = await chatService.getChatById(id)
		
		if (!chat) {
			return res.status(404).json({
				success: false,
				error: 'Чат не найден'
			})
		}
		
		res.json({
			success: true,
			data: chat
		})
	} catch (error) {
		console.error('Ошибка получения чата:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения чата'
		})
	}
})

// POST /api/chats - создать новый чат
router.post('/', async (req: Request, res: Response) => {
	try {
		const { telegramId, title } = req.body
		
		if (!telegramId || !title) {
			return res.status(400).json({
				success: false,
				error: 'TelegramId и title обязательны'
			})
		}
		
		const chat = await chatService.createChat({
			telegramId: telegramId.toString(),
			title
		})
		
		res.status(201).json({
			success: true,
			data: chat
		})
	} catch (error) {
		console.error('Ошибка создания чата:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка создания чата'
		})
	}
})

// PUT /api/chats/:id - обновить чат
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const id = req.params.id
		const updateData = req.body
		
		const chat = await chatService.updateChat(id, updateData)
		
		if (!chat) {
			return res.status(404).json({
				success: false,
				error: 'Чат не найден'
			})
		}
		
		res.json({
			success: true,
			data: chat
		})
	} catch (error) {
		console.error('Ошибка обновления чата:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка обновления чата'
		})
	}
})

// DELETE /api/chats/:id - удалить чат
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const id = req.params.id
		const success = await chatService.deleteChat(id)
		
		if (!success) {
			return res.status(404).json({
				success: false,
				error: 'Чат не найден'
			})
		}
		
		res.json({
			success: true,
			message: 'Чат удален'
		})
	} catch (error) {
		console.error('Ошибка удаления чата:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка удаления чата'
		})
	}
})

// GET /api/chats/:id/members - получить участников чата
router.get('/:id/members', async (req: Request, res: Response) => {
	try {
		const chatId = req.params.id
		const members = await chatService.getChatMembers(chatId)
		
		res.json({
			success: true,
			data: members,
			count: members.length
		})
	} catch (error) {
		console.error('Ошибка получения участников чата:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения участников чата'
		})
	}
})

// POST /api/chats/:id/members - добавить участника в чат
router.post('/:id/members', async (req: Request, res: Response) => {
	try {
		const chatId = req.params.id
		const { userId } = req.body
		
		if (!userId) {
			return res.status(400).json({
				success: false,
				error: 'userId обязателен'
			})
		}
		
		await chatService.addMember(chatId, userId)
		
		res.json({
			success: true,
			message: 'Участник добавлен в чат'
		})
	} catch (error) {
		console.error('Ошибка добавления участника:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка добавления участника'
		})
	}
})

// DELETE /api/chats/:id/members/:userId - удалить участника из чата
router.delete('/:id/members/:userId', async (req: Request, res: Response) => {
	try {
		const chatId = req.params.id
		const userId = req.params.userId
		
		const success = await chatService.removeMember(chatId, userId)
		
		if (!success) {
			return res.status(404).json({
				success: false,
				error: 'Участник не найден'
			})
		}
		
		res.json({
			success: true,
			message: 'Участник удален из чата'
		})
	} catch (error) {
		console.error('Ошибка удаления участника:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка удаления участника'
		})
	}
})

// GET /api/chats/:id/tasks - получить задачи чата
router.get('/:id/tasks', async (req: Request, res: Response) => {
	try {
		const chatId = req.params.id
		const tasks = await chatService.getChatTasks(chatId)
		
		res.json({
			success: true,
			data: tasks,
			count: tasks.length
		})
	} catch (error) {
		console.error('Ошибка получения задач чата:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения задач чата'
		})
	}
})

export default router
