import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { ChatEntity } from './Chat'
import { UserEntity } from './User'
import { RoleEntity } from './Role'

// Сущность участника чата (связующая таблица)
@Entity('chat_members')
@Unique(['chatId', 'userId']) // Уникальная связь пользователь-чат
export class ChatMemberEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'bigint' })
    chatId!: string // ID чата

    @Column({ type: 'bigint' })
    userId!: string // ID пользователя

    @Column({ type: 'integer', nullable: true })
    roleId?: number // ID роли (может быть null)

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    joinedAt!: Date // Дата присоединения к чату

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt!: Date // Дата последнего обновления

    @ManyToOne(() => ChatEntity, chat => chat.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chatId' })
    chat!: ChatEntity

    @ManyToOne(() => UserEntity, user => user.chatMemberships, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity

    @ManyToOne(() => RoleEntity, role => role.members, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'roleId' })
    role?: RoleEntity
}