import { RoleEntity } from '../entities/Role'
import { UserEntity } from '../entities/User'

// Интерфейс пользователя для Gemini (с полной информацией)
export interface GeminiUser {
	telegramId: string
	username: string
	firstName: string
	lastName?: string
}

// Интерфейс роли для Gemini (с полной информацией)
export interface GeminiRole {
	id: number
	name: string
	chatId: string
	memberIds: string[] // ID участников с этой ролью
}

// Интерфейс задачи для Gemini (с полной информацией)
export interface GeminiTask {
	id: number
	readableId: string
	title: string
	description: string
	deadline: string | null
	type: 'personal' | 'group'
	authorId: string
	chatId?: string
	assignedUserId?: string
	assignedRoleId?: number
	isCompleted: boolean
}

// Интерфейс участника чата для Gemini
export interface GeminiChatMember {
	userId: string
	username: string
	firstName: string
	lastName?: string
	roleId?: number
	roleName?: string
}

// === Интерфейсы для создания (ответ от Gemini) ===

// Интерфейс роли для создания
export interface Role {
	name: string
}

// Интерфейс задачи для создания
export interface Task {
	title: string
	description: string
	deadline: string | null
	assignedUserId: string | null // Теперь передаем ID
	assignedRoleId: number | null // Теперь передаем ID
}

// === Операции ===

// Интерфейс операции с задачей
export interface TaskOperation {
	operation: 'delete' | 'update' | 'complete'
	taskId: number // Теперь числовой ID
	updateData?: {
		title?: string
		description?: string
		deadline?: Date
		assignedUser?: UserEntity
		assignedRole?: RoleEntity
		isCompleted?: boolean
	}
}

// Интерфейс операции с ролью
export interface RoleOperation {
	operation: 'create' | 'update' | 'delete' | 'assign' | 'unassign'
	roleId?: number // ID роли для операций
	roleName?: string // Имя роли для создания или операций
	newRoleName?: string // Для операции update
	targetUserId?: string // ID пользователя для операций assign/unassign
}

// Интерфейс команды бота
export interface BotCommand {
	command: string
	reason: string
}

// Интерфейс ответа от Gemini
export interface AudioTranscriptionResponse {
	customMessage?: string // Кастомное сообщение когда нет действий
	roles: Role[]
	tasks: Task[]
	taskOperations?: TaskOperation[]
	roleOperations?: RoleOperation[]
	commands?: BotCommand[]
	viewRequests?: ViewRequest[]
}

// Интерфейс запроса на просмотр
export interface ViewRequest {
	type: 'tasks' | 'members' | 'roles' | 'userTasks'
}
