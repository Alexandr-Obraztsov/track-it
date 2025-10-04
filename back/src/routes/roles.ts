import { Router, Request, Response } from 'express'
import { roleService } from '../server'
import { CreateRoleDto, UpdateRoleDto } from '../services/roleService'

const router: Router = Router()

// GET /api/roles - получить все роли
router.get('/', async (req: Request, res: Response) => {
	try {
		const { chatId } = req.query
		
		let roles
		if (chatId) {
			roles = await roleService.getChatRoles(chatId as string)
		} else {
			roles = await roleService.getAllRoles()
		}
		
		res.json({
			success: true,
			data: roles,
			count: roles.length
		})
	} catch (error) {
		console.error('Ошибка получения ролей:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения ролей'
		})
	}
})

// GET /api/roles/:id - получить роль по ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id)
		const role = await roleService.getRoleById(id)
		
		if (!role) {
			return res.status(404).json({
				success: false,
				error: 'Роль не найдена'
			})
		}
		
		res.json({
			success: true,
			data: role
		})
	} catch (error) {
		console.error('Ошибка получения роли:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения роли'
		})
	}
})

// POST /api/roles - создать новую роль
router.post('/', async (req: Request, res: Response) => {
	try {
		const { name, chatId } = req.body
		
		if (!name || !chatId) {
			return res.status(400).json({
				success: false,
				error: 'name и chatId обязательны'
			})
		}
		
		const role = await roleService.createRole({
			name,
			chatId
		})
		
		res.status(201).json({
			success: true,
			data: role
		})
	} catch (error) {
		console.error('Ошибка создания роли:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка создания роли'
		})
	}
})

// PUT /api/roles/:id - обновить роль
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id)
		const updateData = req.body
		
		const role = await roleService.updateRole(id, updateData)
		
		if (!role) {
			return res.status(404).json({
				success: false,
				error: 'Роль не найдена'
			})
		}
		
		res.json({
			success: true,
			data: role
		})
	} catch (error) {
		console.error('Ошибка обновления роли:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка обновления роли'
		})
	}
})

// DELETE /api/roles/:id - удалить роль
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id)
		const success = await roleService.deleteRole(id)
		
		if (!success) {
			return res.status(404).json({
				success: false,
				error: 'Роль не найдена'
			})
		}
		
		res.json({
			success: true,
			message: 'Роль удалена'
		})
	} catch (error) {
		console.error('Ошибка удаления роли:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка удаления роли'
		})
	}
})

// GET /api/roles/:id/members - получить участников роли
router.get('/:id/members', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id)
		const members = await roleService.getRoleMembers(id)
		
		res.json({
			success: true,
			data: members,
			count: members.length
		})
	} catch (error) {
		console.error('Ошибка получения участников роли:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения участников роли'
		})
	}
})

// POST /api/roles/:id/assign - назначить роль пользователю
router.post('/:id/assign', async (req: Request, res: Response) => {
	try {
		const roleId = parseInt(req.params.id)
		const { userId } = req.body
		
		if (!userId) {
			return res.status(400).json({
				success: false,
				error: 'userId обязателен'
			})
		}
		
		await roleService.assignRoleToMember(roleId, userId)
		
		res.json({
			success: true,
			message: 'Роль назначена пользователю'
		})
	} catch (error) {
		console.error('Ошибка назначения роли:', error)
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка назначения роли'
		})
	}
})

// DELETE /api/roles/:id/assign/:userId - снять роль с пользователя
router.delete('/:id/assign/:userId', async (req: Request, res: Response) => {
	try {
		const roleId = parseInt(req.params.id)
		const userId = req.params.userId
		
		const success = await roleService.removeRoleFromMember(roleId, userId)
		
		if (!success) {
			return res.status(404).json({
				success: false,
				error: 'Назначение роли не найдено'
			})
		}
		
		res.json({
			success: true,
			message: 'Роль снята с пользователя'
		})
	} catch (error) {
		console.error('Ошибка снятия роли:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка снятия роли'
		})
	}
})

// GET /api/roles/:id/tasks - получить задачи роли
router.get('/:id/tasks', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id)
		const tasks = await roleService.getRoleTasks(id)
		
		res.json({
			success: true,
			data: tasks,
			count: tasks.length
		})
	} catch (error) {
		console.error('Ошибка получения задач роли:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка получения задач роли'
		})
	}
})

export default router
