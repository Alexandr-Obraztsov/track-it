import { DataSource, Repository } from 'typeorm'
import { ChatEntity } from '../entities/Chat'
import { ChatMemberEntity } from '../entities/ChatMember'

// Сервис для управления беседами и участниками
export class ChatService {
    private chatRepository: Repository<ChatEntity>
    private memberRepository: Repository<ChatMemberEntity>

    constructor(dataSource: DataSource) {
        this.chatRepository = dataSource.getRepository(ChatEntity)
        this.memberRepository = dataSource.getRepository(ChatMemberEntity)
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

    // Получение ID приветственного сообщения
    async getWelcomeMessageId(chatId: string): Promise<number | null> {
        const chat = await this.chatRepository.findOne({ where: { chatId } })
        return chat?.welcomeMessageId || null
    }

    // Назначение роли пользователю
    async assignRoleToUser(chatId: string, userId: string, roleId: number): Promise<boolean> {
        try {
            const member = await this.memberRepository.findOne({ where: { chatId, userId } })
            if (!member) {
                return false
            }
            
            member.roleId = roleId
            await this.memberRepository.save(member)
            return true
        } catch (error) {
            console.error('Ошибка при назначении роли пользователю:', error)
            return false
        }
    }

    // Удаление роли у пользователя (назначение роли member по умолчанию)
    async removeRoleFromUser(chatId: string, userId: string): Promise<boolean> {
        try {
            const member = await this.memberRepository.findOne({ where: { chatId, userId } })
            if (!member) {
                return false
            }
            
            // Назначаем роль member по умолчанию
            member.roleId = undefined
            await this.memberRepository.save(member)
            return true
        } catch (error) {
            console.error('Ошибка при удалении роли у пользователя:', error)
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
}