import { DataSource, Repository } from 'typeorm'
import { UserEntity } from '../entities/User'
import { ChatMemberEntity } from '../entities/ChatMember'
import { TaskEntity } from '../entities/Task'

// Интерфейс для создания пользователя
export interface CreateUserDto {
	telegramId: string
	username: string
	firstName: string
	lastName?: string
}

// Интерфейс для обновления пользователя
export interface UpdateUserDto {
	username?: string
	firstName?: string
	lastName?: string
}

// Сервис для управления пользователями
export class UserService {
	private userRepository: Repository<UserEntity>
	private memberRepository: Repository<ChatMemberEntity>
	private taskRepository: Repository<TaskEntity>

	constructor(dataSource: DataSource) {
		this.userRepository = dataSource.getRepository(UserEntity)
		this.memberRepository = dataSource.getRepository(ChatMemberEntity)
		this.taskRepository = dataSource.getRepository(TaskEntity)
	}

	// Создание или получение пользователя
	async createOrGetUser(data: CreateUserDto): Promise<UserEntity> {
		let user = await this.userRepository.findOne({
			where: { telegramId: data.telegramId },
		})

		if (!user) {
			user = this.userRepository.create(data)
			user = await this.userRepository.save(user)
		}

		return user
	}

	// Получение пользователя по Telegram ID
	async getUserById(telegramId: string): Promise<UserEntity | null> {
		return await this.userRepository.findOne({
			where: { telegramId },
			relations: [
				'assignedTasks',
				'chatMemberships',
				'chatMemberships.chat',
				'chatMemberships.role',
			],
		})
	}

	// Получение всех пользователей
	async getAllUsers(): Promise<UserEntity[]> {
		return await this.userRepository.find({
			relations: ['chatMemberships', 'chatMemberships.chat'],
			order: { createdAt: 'DESC' },
		})
	}

	// Обновление пользователя
	async updateUser(telegramId: string, data: UpdateUserDto): Promise<UserEntity | null> {
		const user = await this.userRepository.findOne({
			where: { telegramId },
		})

		if (!user) {
			return null
		}

		Object.assign(user, data)
		return await this.userRepository.save(user)
	}

	// Удаление пользователя (осторожно - удалит все связанные данные)
	async deleteUser(telegramId: string): Promise<boolean> {
		const result = await this.userRepository.delete({ telegramId })
		return (result.affected || 0) > 0
	}

	// Получение чатов пользователя
	async getUserChats(telegramId: string): Promise<ChatMemberEntity[]> {
		return await this.memberRepository.find({
			where: { userId: telegramId },
			relations: ['chat', 'role'],
			order: { joinedAt: 'DESC' },
		})
	}


	// Получение задач, назначенных пользователю
	async getUserAssignedTasks(telegramId: string): Promise<TaskEntity[]> {
		return await this.taskRepository.find({
			where: { assignedUserId: telegramId },
			relations: ['chat', 'assignedRole'],
			order: { createdAt: 'DESC' },
		})
	}

	// Получение личных задач пользователя
	async getUserPersonalTasks(telegramId: string): Promise<TaskEntity[]> {
		return await this.taskRepository.find({
			where: {
				assignedUserId: telegramId,
				type: 'personal',
			},
			relations: ['assignedUser'],
			order: { createdAt: 'DESC' },
		})
	}

	// Получение статистики пользователя
	async getUserStats(telegramId: string): Promise<{
		totalAssignedTasks: number
		completedTasks: number
		pendingTasks: number
		totalChats: number
	}> {
		const assignedTasks = await this.taskRepository.count({
			where: { assignedUserId: telegramId },
		})

		const completedTasks = await this.taskRepository.count({
			where: {
				assignedUserId: telegramId,
				isCompleted: true,
			},
		})

		const pendingTasks = await this.taskRepository.count({
			where: {
				assignedUserId: telegramId,
				isCompleted: false,
			},
		})

		const totalChats = await this.memberRepository.count({
			where: { userId: telegramId },
		})

		return {
			totalAssignedTasks: assignedTasks,
			completedTasks,
			pendingTasks,
			totalChats,
		}
	}

	// Поиск пользователей по имени или username
	async searchUsers(query: string): Promise<UserEntity[]> {
		return await this.userRepository
			.createQueryBuilder('user')
			.where('user.username LIKE :query', { query: `%${query}%` })
			.orWhere('user.firstName LIKE :query', { query: `%${query}%` })
			.orWhere('user.lastName LIKE :query', { query: `%${query}%` })
			.getMany()
	}

	// Проверка существования пользователя
	async userExists(telegramId: string): Promise<boolean> {
		const count = await this.userRepository.count({
			where: { telegramId },
		})
		return count > 0
	}

	// Получение пользователей чата
	async getChatUsers(chatId: string): Promise<UserEntity[]> {
		const members = await this.memberRepository.find({
			where: { chatId },
			relations: ['user'],
			order: { joinedAt: 'ASC' },
		})

		return members.map(member => member.user).filter(user => user)
	}
}
