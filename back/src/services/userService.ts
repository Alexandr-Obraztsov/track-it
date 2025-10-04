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
			order: { firstName: 'ASC' },
		})
	}

	// Создание пользователя
	async createUser(data: CreateUserDto): Promise<UserEntity> {
		const user = this.userRepository.create(data)
		return await this.userRepository.save(user)
	}

	// Обновление пользователя
	async updateUser(telegramId: string, data: UpdateUserDto): Promise<UserEntity | null> {
		await this.userRepository.update({ telegramId }, data)
		return await this.getUserById(telegramId)
	}

	// Удаление пользователя
	async deleteUser(telegramId: string): Promise<boolean> {
		const result = await this.userRepository.delete({ telegramId })
		return result.affected !== 0
	}

	// Получение задач, назначенных пользователю
	async getUserAssignedTasks(userId: string, chatId?: string): Promise<TaskEntity[]> {
		const where: any = {
			assignedUserId: userId,
		}

		if (chatId) {
			where.chatId = chatId
		}

		return await this.taskRepository.find({
			where,
			relations: ['chat', 'assignedUser', 'assignedRole'],
			order: { createdAt: 'DESC' },
		})
	}

	// Получение личных задач пользователя
	async getUserPersonalTasks(userId: string): Promise<TaskEntity[]> {
		return await this.taskRepository.find({
			where: {
				assignedUserId: userId,
				type: 'personal',
			},
			relations: ['assignedUser'],
			order: { createdAt: 'DESC' },
		})
	}

	// Получение чатов пользователя
	async getUserChats(userId: string): Promise<any[]> {
		const members = await this.memberRepository.find({
			where: { userId },
			relations: ['chat'],
		})

		return members.map(member => member.chat)
	}
}
