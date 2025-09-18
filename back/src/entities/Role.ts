import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { ChatEntity } from './Chat'
import { ChatMemberEntity } from './ChatMember'
import { TaskEntity } from './Task'

// Сущность роли в чате
@Entity('roles')
export class RoleEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'varchar' })
    name!: string // Название роли

    @Column({ type: 'bigint' })
    chatId!: string // ID чата

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date // Дата создания

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt!: Date // Дата последнего обновления

    @ManyToOne(() => ChatEntity, chat => chat.roles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chatId' })
    chat!: ChatEntity

    @OneToMany(() => ChatMemberEntity, membership => membership.role)
    members?: ChatMemberEntity[] // Участники с этой ролью

    @OneToMany(() => TaskEntity, task => task.assignedRole)
    assignedTasks?: TaskEntity[] // Задачи, назначенные на эту роль
}