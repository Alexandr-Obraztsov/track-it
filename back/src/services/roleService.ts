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
            where: { telegramId: data.chatId }
        })
        if (!chat) {
            throw new Error('Чат не найден')
        }

        // Проверяем уникальность имени роли в чате
        const existingRole = await this.roleRepository.findOne({
            where: { name: data.name, chatId: data.chatId }
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
            relations: ['chat', 'members', 'members.user', 'assignedTasks']
        })
    }

    // Получение роли по имени в чате
    async getRoleByName(chatId: string, name: string): Promise<RoleEntity | null> {
        return await this.roleRepository.findOne({
            where: { chatId, name },
            relations: ['chat', 'members', 'members.user', 'assignedTasks']
        })
    }

    // Получение всех ролей чата
    async getChatRoles(chatId: string): Promise<RoleEntity[]> {
        return await this.roleRepository.find({
            where: { chatId },
            relations: ['members', 'members.user'],
            order: { createdAt: 'ASC' }
        })
    }

    // Получение всех ролей
    async getAllRoles(): Promise<RoleEntity[]> {
        return await this.roleRepository.find({
            relations: ['chat', 'members'],
            order: { createdAt: 'DESC' }
        })
    }

    // Обновление роли
    async updateRole(id: number, data: UpdateRoleDto): Promise<RoleEntity | null> {
        const role = await this.roleRepository.findOne({ where: { id } })
        if (!role) {
            return null
        }

        // Проверяем уникальность нового имени в чате
        if (data.name && data.name !== role.name) {
            const existingRole = await this.roleRepository.findOne({
                where: { name: data.name, chatId: role.chatId }
            })
            if (existingRole) {
                throw new Error('Роль с таким именем уже существует в этом чате')
            }
        }

        Object.assign(role, data)
        return await this.roleRepository.save(role)
    }

    // Удаление роли
    async deleteRole(id: number): Promise<boolean> {
        // Сначала снимаем роль со всех участников
        const membersWithRole = await this.memberRepository.find({
            where: { roleId: id }
        })
        
        for (const member of membersWithRole) {
            member.roleId = undefined
            await this.memberRepository.save(member)
        }

        const result = await this.roleRepository.delete(id)
        return (result.affected || 0) > 0
    }

    // Удаление роли по имени в чате
    async deleteRoleByName(chatId: string, name: string): Promise<boolean> {
        const role = await this.getRoleByName(chatId, name)
        if (!role) {
            return false
        }
        return await this.deleteRole(role.id)
    }

    // Получение участников роли
    async getRoleMembers(roleId: number): Promise<ChatMemberEntity[]> {
        return await this.memberRepository.find({
            where: { roleId },
            relations: ['user', 'chat']
        })
    }

    // Назначение роли участнику
    async assignRoleToMember(chatId: string, userId: string, roleId: number): Promise<boolean> {
        // Проверяем существование роли
        const role = await this.roleRepository.findOne({
            where: { id: roleId, chatId }
        })
        if (!role) {
            return false
        }

        // Проверяем существование участника
        const member = await this.memberRepository.findOne({
            where: { chatId, userId }
        })
        if (!member) {
            return false
        }

        // Назначаем роль
        member.roleId = roleId
        await this.memberRepository.save(member)
        return true
    }

    // Снятие роли с участника
    async removeRoleFromMember(chatId: string, userId: string): Promise<boolean> {
        const member = await this.memberRepository.findOne({
            where: { chatId, userId }
        })
        if (!member) {
            return false
        }

        member.roleId = undefined
        await this.memberRepository.save(member)
        return true
    }

    // Получение количества участников роли
    async getRoleMemberCount(roleId: number): Promise<number> {
        return await this.memberRepository.count({
            where: { roleId }
        })
    }

    // Получение количества задач, назначенных роли
    async getRoleTaskCount(roleId: number): Promise<number> {
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
            relations: ['assignedTasks']
        })
        return role?.assignedTasks?.length || 0
    }
}