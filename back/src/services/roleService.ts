import { DataSource, Repository } from 'typeorm'
import { RoleEntity } from '../entities/Role'
import { ChatEntity } from '../entities/Chat'
import { ChatMemberEntity } from '../entities/ChatMember'

// Интерфейс для создания роли
export interface CreateRoleDto {
	name: string
	chatId: string
}

// Интерфейс для обновления роли
export interface UpdateRoleDto {
	name?: string
}

// Сервис для управления ролями
export class RoleService {
	private roleRepository: Repository<RoleEntity>
	private chatRepository: Repository<ChatEntity>
	private memberRepository: Repository<ChatMemberEntity>

	constructor(dataSource: DataSource) {
		this.roleRepository = dataSource.getRepository(RoleEntity)
		this.chatRepository = dataSource.getRepository(ChatEntity)
		this.memberRepository = dataSource.getRepository(ChatMemberEntity)
	}

	// Создание роли
	async createRole(data: CreateRoleDto): Promise<RoleEntity> {
		// Проверяем существование чата
		const chat = await this.chatRepository.findOne({
			where: { telegramId: data.chatId },
		})
		if (!chat) {
			throw new Error('Чат не найден')
		}

		// Проверяем уникальность имени роли в чате
		const existingRole = await this.roleRepository.findOne({
			where: { name: data.name, chatId: data.chatId },
		})
		if (existingRole) {
			throw new Error('Роль с таким именем уже существует в этом чате')
		}

		const role = this.roleRepository.create(data)
		return await this.roleRepository.save(role)
	}

	// Получение роли по ID
	async getRoleById(id: number): Promise<RoleEntity | null> {
		return await this.roleRepository.findOne({
			where: { id },
			relations: ['chat', 'members', 'members.user', 'assignedTasks'],
		})
	}

	// Получение роли по имени в чате
	async getRoleByName(chatId: string, name: string): Promise<RoleEntity | null> {
		return await this.roleRepository.findOne({
			where: { chatId, name },
			relations: ['chat', 'members', 'members.user', 'assignedTasks'],
		})
	}

	// Получение всех ролей чата
	async getChatRoles(chatId: string): Promise<RoleEntity[]> {
		return await this.roleRepository.find({
			where: { chatId },
			relations: ['members', 'members.user'],
			order: { createdAt: 'ASC' },
		})
	}

	// Получение всех ролей
	async getAllRoles(): Promise<RoleEntity[]> {
		return await this.roleRepository.find({
			relations: ['chat', 'members', 'members.user'],
			order: { createdAt: 'ASC' },
		})
	}

	// Обновление роли
	async updateRole(id: number, data: UpdateRoleDto): Promise<RoleEntity | null> {
		await this.roleRepository.update({ id }, data)
		return await this.getRoleById(id)
	}

	// Удаление роли
	async deleteRole(id: number): Promise<boolean> {
		const result = await this.roleRepository.delete({ id })
		return result.affected !== 0
	}

	// Получение участников роли
	async getRoleMembers(roleId: number): Promise<ChatMemberEntity[]> {
		return await this.memberRepository.find({
			where: { roleId },
			relations: ['user', 'chat'],
			order: { joinedAt: 'ASC' },
		})
	}

	// Назначение роли пользователю
	async assignRoleToMember(roleId: number, userId: string): Promise<ChatMemberEntity> {
		// Находим роль
		const role = await this.getRoleById(roleId)
		if (!role) {
			throw new Error('Роль не найдена')
		}

		// Проверяем, не назначена ли уже эта роль пользователю в этом чате
		const existingMember = await this.memberRepository.findOne({
			where: { chatId: role.chatId, userId },
		})

		if (existingMember) {
			// Обновляем существующего участника
			existingMember.roleId = roleId
			return await this.memberRepository.save(existingMember)
		} else {
			// Создаем нового участника
			const member = this.memberRepository.create({
				chatId: role.chatId,
				userId,
				roleId,
			})
			return await this.memberRepository.save(member)
		}
	}

	// Снятие роли с пользователя
	async removeRoleFromMember(roleId: number, userId: string): Promise<boolean> {
		const result = await this.memberRepository.delete({ roleId, userId })
		return result.affected !== 0
	}

	// Получение задач роли
	async getRoleTasks(roleId: number): Promise<any[]> {
		// Этот метод должен быть в TaskService, но добавим для совместимости
		// В реальном проекте лучше использовать TaskService с фильтром по assignedRoleId
		return []
	}
}
