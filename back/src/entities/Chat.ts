import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { TaskEntity } from './Task'
import { ChatMemberEntity } from './ChatMember'
import { RoleEntity } from './Role'

// Сущность беседы для хранения в базе данных
@Entity('chats')
export class ChatEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'bigint', unique: true })
    chatId!: string // ID беседы в Telegram (bigint как строка)

    @Column({ type: 'varchar' })
    title!: string // Название беседы

    @Column({ type: 'varchar', nullable: true })
    username?: string // Username беседы (если есть)

    @Column({ type: 'bigint', nullable: true })
    welcomeMessageId?: number // ID приветственного сообщения

    @Column({ type: 'bigint', nullable: true })
    warningMessageId?: number // ID сообщения с предупреждением о правах

    @OneToMany(() => TaskEntity, task => task.chat, { cascade: true })
    tasks?: TaskEntity[] // Задачи беседы

    @OneToMany(() => ChatMemberEntity, member => member.chat, { cascade: true })
    members?: ChatMemberEntity[] // Все участники беседы

    @OneToMany(() => RoleEntity, role => role.chat, { cascade: true })
    roles?: RoleEntity[] // Все роли беседы
}