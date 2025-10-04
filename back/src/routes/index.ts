import { Router } from 'express'
import tasksRouter from './tasks'
import usersRouter from './users'
import chatsRouter from './chats'
import rolesRouter from './roles'
import voiceRouter from './voice'

const router: Router = Router()

// Подключаем все маршруты
router.use('/tasks', tasksRouter)
router.use('/users', usersRouter)
router.use('/chats', chatsRouter)
router.use('/roles', rolesRouter)
router.use('/voice', voiceRouter)

export default router
