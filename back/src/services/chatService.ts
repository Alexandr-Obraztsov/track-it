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

	// Получение всех чатов
	async getAllChats(): Promise<ChatEntity[]> {
		return await this.chatRepository.find({
			relations: ['members', 'roles'],
			order: { createdAt: 'DESC' },
		})
	}

	// Обновление чата
	async updateChat(telegramId: string, data: UpdateChatDto): Promise<ChatEntity | null> {
		const chat = await this.chatRepository.findOne({
			where: { telegramId },
		})

		if (!chat) {
			return null
		}

		Object.assign(chat, data)
		return await this.chatRepository.save(chat)
	}

	// Удаление чата
	async deleteChat(telegramId: string): Promise<boolean> {
		const result = await this.chatRepository.delete({ telegramId })
		return (result.affected || 0) > 0
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

	// Назначение роли участнику
	async assignRole(chatId: string, userId: string, roleId: number): Promise<ChatMemberEntity | null> {
		const member = await this.memberRepository.findOne({
			where: { chatId, userId },
		})

		if (!member) {
			return null
		}

		member.roleId = roleId
		return await this.memberRepository.save(member)
	}

	// Снятие роли с участника
	async removeRole(chatId: string, userId: string): Promise<ChatMemberEntity | null> {
		const member = await this.memberRepository.findOne({
			where: { chatId, userId },
		})

		if (!member) {
			return null
		}

		member.roleId = undefined
		return await this.memberRepository.save(member)
	}

	// Проверка, является ли пользователь участником чата
	async isMember(chatId: string, userId: string): Promise<boolean> {
		const member = await this.memberRepository.findOne({
			where: { chatId, userId },
		})
		return !!member
	}

	// Получение роли участника в чате
	async getMemberRole(chatId: string, userId: string): Promise<RoleEntity | null> {
		const member = await this.memberRepository.findOne({
			where: { chatId, userId },
			relations: ['role'],
		})
		return member?.role || null
	}

	// Обновление сообщений чата
	async updateWelcomeMessage(chatId: string, messageId: number): Promise<ChatEntity | null> {
		return await this.updateChat(chatId, { welcomeMessageId: messageId })
	}

	async updateWarningMessage(chatId: string, messageId: number): Promise<ChatEntity | null> {
		return await this.updateChat(chatId, { warningMessageId: messageId })
	}

	// Получение ID сообщений
	async getWelcomeMessageId(chatId: string): Promise<number | null> {
		const chat = await this.chatRepository.findOne({
			where: { telegramId: chatId },
		})
		return chat?.welcomeMessageId || null
	}

	async getWarningMessageId(chatId: string): Promise<number | null> {
		const chat = await this.chatRepository.findOne({
			where: { telegramId: chatId },
		})
		return chat?.warningMessageId || null
	}
}
