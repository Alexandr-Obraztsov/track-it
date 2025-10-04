import { Router, Request, Response } from 'express'
import { taskService } from '../server'
import { CreateTaskDto, UpdateTaskDto } from '../services/taskService'

const router: Router = Router()

// GET /api/tasks - получить все задачи
router.get('/', async (req: Request, res: Response) => {
	try {
		const { chatId, userId, type } = req.query
		
		let tasks
		if (type === 'group' && chatId) {
			tasks = await taskService.getGroupTasks(chatId as string)
		} else if (type === 'personal' && userId) {
			tasks = await taskService.getPersonalTasks(userId as string)
		} else if (userId && chatId) {
			tasks = await taskService.getAssignedTasks(userId as string, chatId as string)
		} else {
			tasks = await taskService.getAllTasks()
		}
		
		res.json({
			success: true,
			data: tasks,
			count: tasks.length
		})
	} catch (error) {
		console.error('Ошибка получения задач:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения задач'
		})
	}
})

// GET /api/tasks/:id - получить задачу по ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id)
		const task = await taskService.getTaskById(id)
		
		if (!task) {
			return res.status(404).json({
				success: false,
				error: 'Задача не найдена'
			})
		}
		
		res.json({
			success: true,
			data: task
		})
	} catch (error) {
		console.error('Ошибка получения задачи:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения задачи'
		})
	}
})

// POST /api/tasks - создать новую задачу
router.post('/', async (req: Request, res: Response) => {
	try {
		const taskData: CreateTaskDto = req.body
		const task = await taskService.createTask(taskData)
		
		res.status(201).json({
			success: true,
			data: task
		})
	} catch (error) {
		console.error('Ошибка создания задачи:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка создания задачи'
		})
	}
})

// PUT /api/tasks/:id - обновить задачу
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id)
		const updateData: UpdateTaskDto = req.body
		
		const task = await taskService.updateTask(id, updateData)
		
		if (!task) {
			return res.status(404).json({
				success: false,
				error: 'Задача не найдена'
			})
		}
		
		res.json({
			success: true,
			data: task
		})
	} catch (error) {
		console.error('Ошибка обновления задачи:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка обновления задачи'
		})
	}
})

// DELETE /api/tasks/:id - удалить задачу
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id)
		const success = await taskService.deleteTask(id)
		
		if (!success) {
			return res.status(404).json({
				success: false,
				error: 'Задача не найдена'
			})
		}
		
		res.json({
			success: true,
			message: 'Задача удалена'
		})
	} catch (error) {
		console.error('Ошибка удаления задачи:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка удаления задачи'
		})
	}
})

// PATCH /api/tasks/:id/complete - отметить задачу как выполненную
router.patch('/:id/complete', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id)
		const task = await taskService.updateTask(id, { isCompleted: true })
		
		if (!task) {
			return res.status(404).json({
				success: false,
				error: 'Задача не найдена'
			})
		}
		
		res.json({
			success: true,
			data: task
		})
	} catch (error) {
		console.error('Ошибка завершения задачи:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка завершения задачи'
		})
	}
})

export default router
