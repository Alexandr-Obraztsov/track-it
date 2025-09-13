import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ChatEntity } from './Chat'

// Сущность участника беседы для хранения в базе данных
@Entity('chat_members')
export class ChatMemberEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'varchar' })
    chatId!: string // ID беседы (ссылается на chatId из таблицы chats)

    @Column({ type: 'bigint', unsigned: true })
    userId!: string // ID пользователя в Telegram

    @Column({ type: 'varchar', nullable: true })
    username?: string // Username пользователя

    @Column({ type: 'varchar', nullable: true })
    firstName?: string // Имя пользователя

    @Column({ type: 'varchar', nullable: true })
    lastName?: string // Фамилия пользователя

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    joinedAt!: Date // Дата регистрации в беседе

    @ManyToOne(() => ChatEntity)
    @JoinColumn({ name: 'chatId', referencedColumnName: 'chatId' })
    chat?: ChatEntity
}