import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { TaskEntity } from './Task'

// Сущность беседы для хранения в базе данных
@Entity('chats')
export class ChatEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'bigint', unique: true })
    chatId!: number // ID беседы в Telegram

    @Column({ type: 'varchar' })
    title!: string // Название беседы

    @Column({ type: 'varchar', nullable: true })
    username?: string // Username беседы (если есть)

    @Column({ type: 'bigint', nullable: true })
    welcomeMessageId?: number // ID приветственного сообщения

    @Column({ type: 'bigint', nullable: true })
    warningMessageId?: number // ID сообщения с предупреждением о правах
}