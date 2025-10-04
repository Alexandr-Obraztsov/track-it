import { DataSource, Repository } from 'typeorm'
import { ChatEntity } from '../entities/Chat'
import { ChatMemberEntity } from '../entities/ChatMember'
import { UserEntity } from '../entities/User'
import { RoleEntity } from '../entities/Role'

// Интерфейс для создания чата
export interface CreateChatDto {
	telegramId: string
	title: string
	username?: string
}

// Интерфейс для обновления чата
export interface UpdateChatDto {
	title?: string
	username?: string
	welcomeMessageId?: number
	warningMessageId?: number
}

// Сервис для управления чатами
export class ChatService {
	private chatRepository: Repository<ChatEntity>
	private memberRepository: Repository<ChatMemberEntity>
	private userRepository: Repository<UserEntity>
	private roleRepository: Repository<RoleEntity>

	constructor(dataSource: DataSource) {
		this.chatRepository = dataSource.getRepository(ChatEntity)
		this.memberRepository = dataSource.getRepository(ChatMemberEntity)
		this.userRepository = dataSource.getRepository(UserEntity)
		this.roleRepository = dataSource.getRepository(RoleEntity)
	}

	// Создание или получение чата
	async createOrGetChat(data: CreateChatDto): Promise<ChatEntity> {
		let chat = await this.chatRepository.findOne({
			where: { telegramId: data.telegramId },
		})

		if (!chat) {
			chat = this.chatRepository.create(data)
			chat = await this.chatRepository.save(chat)
		}

		return chat
	}

	// Получение чата по ID
	async getChatById(telegramId: string): Promise<ChatEntity | null> {
		return await this.chatRepository.findOne({
			where: { telegramId },
			relations: ['members', 'members.user', 'members.role', 'roles', 'tasks'],
		})
	}

	// Обновление чата (приватный метод для внутреннего использования)
	private async updateChatInternal(telegramId: string, data: UpdateChatDto): Promise<ChatEntity | null> {
		const chat = await this.chatRepository.findOne({
			where: { telegramId },
		})

		if (!chat) {
			return null
		}

		Object.assign(chat, data)
		return await this.chatRepository.save(chat)
	}

	// Добавление участника в чат
	async addMember(chatId: string, userId: string, roleId?: number): Promise<ChatMemberEntity> {
		// Проверяем существование чата
		const chat = await this.chatRepository.findOne({
			where: { telegramId: chatId },
		})
		if (!chat) {
			throw new Error('Чат не найден')
		}

		// Проверяем существование пользователя
		const user = await this.userRepository.findOne({
			where: { telegramId: userId },
		})
		if (!user) {
			throw new Error('Пользователь не найден')
		}

		// Проверяем, не является ли пользователь уже участником
		const existingMember = await this.memberRepository.findOne({
			where: { chatId, userId },
		})
		if (existingMember) {
			return existingMember
		}

		// Создаем участника
		const member = this.memberRepository.create({
			chatId,
			userId,
			roleId,
		})

		return await this.memberRepository.save(member)
	}

	// Удаление участника из чата
	async removeMember(chatId: string, userId: string): Promise<boolean> {
		const result = await this.memberRepository.delete({ chatId, userId })
		return (result.affected || 0) > 0
	}

	// Получение участников чата
	async getChatMembers(chatId: string): Promise<ChatMemberEntity[]> {
		return await this.memberRepository.find({
			where: { chatId },
			relations: ['user', 'role'],
			order: { joinedAt: 'ASC' },
		})
	}


	// Проверка, является ли пользователь участником чата
	async isMember(chatId: string, userId: string): Promise<boolean> {
		const member = await this.memberRepository.findOne({
			where: { chatId, userId },
		})
		return !!member
	}


	// Обновление сообщений чата
	async updateWelcomeMessage(chatId: string, messageId: number): Promise<ChatEntity | null> {
		return await this.updateChatInternal(chatId, { welcomeMessageId: messageId })
	}

	// Получение ID приветственного сообщения
	async getWelcomeMessageId(chatId: string): Promise<number | null> {
		const chat = await this.chatRepository.findOne({
			where: { telegramId: chatId },
		})
		return chat?.welcomeMessageId || null
	}

	// Получение всех чатов
	async getAllChats(): Promise<ChatEntity[]> {
		return await this.chatRepository.find({
			relations: ['members', 'members.user', 'members.role', 'roles', 'tasks'],
			order: { title: 'ASC' },
		})
	}

	// Создание чата
	async createChat(data: CreateChatDto): Promise<ChatEntity> {
		const chat = this.chatRepository.create(data)
		return await this.chatRepository.save(chat)
	}

	// Обновление чата (публичный метод для API)
	async updateChat(telegramId: string, data: UpdateChatDto): Promise<ChatEntity | null> {
		return await this.updateChatInternal(telegramId, data)
	}

	// Удаление чата
	async deleteChat(telegramId: string): Promise<boolean> {
		const result = await this.chatRepository.delete({ telegramId })
		return result.affected !== 0
	}

	// Получение задач чата
	async getChatTasks(chatId: string): Promise<any[]> {
		// Этот метод должен быть в TaskService, но добавим для совместимости
		// В реальном проекте лучше использовать TaskService.getGroupTasks
		return []
	}
}
