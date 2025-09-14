import { DataSource, Repository } from 'typeorm'
import { ChatEntity } from '../entities/Chat'
import { ChatMemberEntity } from '../entities/ChatMember'
import { RoleService } from './roleService'

// Сервис для управления беседами и участниками
export class ChatService {
    private chatRepository: Repository<ChatEntity>
    private memberRepository: Repository<ChatMemberEntity>
    private roleService: RoleService

    constructor(dataSource: DataSource) {
        this.chatRepository = dataSource.getRepository(ChatEntity)
        this.memberRepository = dataSource.getRepository(ChatMemberEntity)
        this.roleService = new RoleService(dataSource)
    }

    // Создание или получение беседы
    async getOrCreateChat(chatId: string, title: string, username?: string): Promise<ChatEntity> {
        let chat = await this.chatRepository.findOne({ where: { chatId } })
        if (!chat) {
            chat = this.chatRepository.create({ chatId, title, username })
            await this.chatRepository.save(chat)
        }
        return chat
    }

    // Регистрация участника в беседе
    async registerMember(chatId: string, userId: string, username?: string, firstName?: string, lastName?: string): Promise<ChatMemberEntity> {
        let member = await this.memberRepository.findOne({ where: { chatId, userId } })
        if (!member) {
            member = this.memberRepository.create({
                chatId,
                userId,
                username,
                firstName,
                lastName
            })
            await this.memberRepository.save(member)
        }
        return member
    }

    // Получение всех участников беседы
    async getChatMembers(chatId: string): Promise<ChatMemberEntity[]> {
        return await this.memberRepository.find({
            where: { chatId },
            relations: ['role'],
            order: { joinedAt: 'ASC' }
        })
    }

    // Проверка, зарегистрирован ли участник
    async isMemberRegistered(chatId: string, userId: string): Promise<boolean> {
        const member = await this.memberRepository.findOne({ where: { chatId, userId } })
        return !!member
    }

    // Получение участника по ID
    async getMemberById(chatId: string, userId: string): Promise<ChatMemberEntity | null> {
        return await this.memberRepository.findOne({ where: { chatId, userId } })
    }

    // Обновление ID приветственного сообщения
    async updateWelcomeMessageId(chatId: string, messageId: number): Promise<void> {
        await this.chatRepository.update({ chatId }, { welcomeMessageId: messageId })
    }

    // Обновление ID сообщения с предупреждением
    async updateWarningMessageId(chatId: string, messageId: number): Promise<void> {
        await this.chatRepository.update({ chatId }, { warningMessageId: messageId })
    }

    // Получение ID сообщения с предупреждением
    async getWarningMessageId(chatId: string): Promise<number | null> {
        const chat = await this.chatRepository.findOne({ where: { chatId } })
        return chat?.warningMessageId || null
    }

    /**
     * Получение ID приветственного сообщения
     */
    async getWelcomeMessageId(chatId: string): Promise<number | null> {
        const chat = await this.chatRepository.findOne({ where: { chatId } })
        return chat?.welcomeMessageId || null
    }

    /**
     * Назначение роли участнику
     */
    async setRoleForMember(chatId: string, userId: string, roleId: number | undefined): Promise<boolean> {
        try {
            const member = await this.memberRepository.findOne({ where: { chatId, userId } })
            if (!member) {
                return false
            }

            member.roleId = roleId
            await this.memberRepository.save(member)
            return true
        } catch (error) {
            console.error('Ошибка при назначении роли участнику:', error)
            return false
        }
    }

    // Получение пользователя с ролью
    async getMemberWithRole(chatId: string, userId: string): Promise<ChatMemberEntity | null> {
        return await this.memberRepository.findOne({
            where: { chatId, userId },
            relations: ['role']
        })
    }

    // Получение ролей чата с информацией о пользователях
    async getChatRolesWithMembers(chatId: string): Promise<Array<{
        id: number
        name: string
        membersCount: number
        members: string[]
    }>> {
        const roles = await this.roleService.getChatRoles(chatId)
        const result = []

        for (const role of roles) {
            const members = await this.memberRepository.find({
                where: { chatId, roleId: role.id }
            })

            result.push({
                id: role.id,
                name: role.name,
                membersCount: members.length,
                members: members.map(member => member.firstName || member.username || 'Неизвестный')
            })
        }

        return result
    }
}