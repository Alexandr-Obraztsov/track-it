import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm'
import { TaskEntity } from './Task'
import { ChatMemberEntity } from './ChatMember'
import { RoleEntity } from './Role'

// Сущность чата Telegram
@Entity('chats')
export class ChatEntity {
    @PrimaryColumn({ type: 'bigint' })
    telegramId!: string // ID чата в Telegram как первичный ключ

    @Column({ type: 'varchar' })
    title!: string // Название чата

    @Column({ type: 'varchar', nullable: true })
    username?: string // Username чата (если есть)

    @Column({ type: 'bigint', nullable: true })
    welcomeMessageId?: number // ID приветственного сообщения

    @Column({ type: 'bigint', nullable: true })
    warningMessageId?: number // ID сообщения с предупреждением

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date // Дата создания

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt!: Date // Дата последнего обновления

    @OneToMany(() => TaskEntity, task => task.chat)
    tasks?: TaskEntity[] // Групповые задачи чата

    @OneToMany(() => ChatMemberEntity, membership => membership.chat)
    members?: ChatMemberEntity[] // Участники чата

    @OneToMany(() => RoleEntity, role => role.chat)
    roles?: RoleEntity[] // Роли в чате
}