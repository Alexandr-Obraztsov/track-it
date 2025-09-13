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
    async getOrCreateChat(chatId: number, title: string, username?: string): Promise<ChatEntity> {
        let chat = await this.chatRepository.findOne({ where: { chatId } })
        if (!chat) {
            chat = this.chatRepository.create({ chatId, title, username })
            await this.chatRepository.save(chat)
        }
        return chat
    }

    // Регистрация участника в беседе
    async registerMember(chatId: number, userId: number, username?: string, firstName?: string, lastName?: string): Promise<ChatMemberEntity> {
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
    async getChatMembers(chatId: number): Promise<ChatMemberEntity[]> {
        return await this.memberRepository.find({
            where: { chatId },
            order: { joinedAt: 'ASC' }
        })
    }

    // Проверка, зарегистрирован ли участник
    async isMemberRegistered(chatId: number, userId: number): Promise<boolean> {
        const member = await this.memberRepository.findOne({ where: { chatId, userId } })
        return !!member
    }

    // Получение участника по ID
    async getMemberById(chatId: number, userId: number): Promise<ChatMemberEntity | null> {
        return await this.memberRepository.findOne({ where: { chatId, userId } })
    }

    // Получение информации о беседе
    async getChat(chatId: number): Promise<ChatEntity | null> {
        return await this.chatRepository.findOne({ where: { chatId } })
    }
}