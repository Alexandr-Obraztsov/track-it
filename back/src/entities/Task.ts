import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ChatEntity } from './Chat'
import { RoleEntity } from './Role'
import { ChatMemberEntity } from './ChatMember'

// Сущность задачи для хранения в базе данных
@Entity('tasks')
export class TaskEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'varchar' })
    title!: string // Название задачи

    @Column({ type: 'text' })
    description!: string // Описание задачи

    @Column({ type: 'varchar' })
    readableId!: string // Читаемый ID задачи (например: CHT-123)

    @Column({
        type: 'enum',
        enum: ['high', 'medium', 'low'],
    })
    priority!: 'high' | 'medium' | 'low' // Приоритет задачи

    @Column({ type: 'varchar', nullable: true })
    deadline!: string | null // Срок выполнения (в формате YYYY-MM-DD)

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date // Дата создания задачи

    @Column({
        type: 'enum',
        enum: ['personal', 'group'],
        default: 'personal'
    })
    type!: 'personal' | 'group' // Тип задачи: личная или групповая

    @Column({ type: 'bigint', unsigned: true, nullable: true })
    userId!: string | null // ID пользователя Telegram (для личных задач)

    @Column({ type: 'bigint', unsigned: true })
    authorUserId!: string // ID пользователя, который создал задачу

    @Column({ type: 'varchar', nullable: true })
    chatId!: string | null // ID группы (для групповых задач) - ссылается на chatId в chats

    @Column({ type: 'bigint', unsigned: true, nullable: true })
    assignedToUserId!: string | null // ID пользователя, которому назначена задача (для групповых задач)

    @Column({ type: 'int', nullable: true })
    assignedToRoleId!: number | null // ID роли, которой назначена задача

    @Column({ type: 'boolean', default: false })
    isCompleted!: boolean // Статус выполнения задачи

    @ManyToOne(() => ChatEntity, chat => chat.tasks)
    @JoinColumn({ name: 'chatId', referencedColumnName: 'chatId' })
    chat?: ChatEntity

    // Автор задачи - ищем участника чата по authorUserId и chatId
    @ManyToOne(() => ChatMemberEntity, { nullable: true })
    @JoinColumn([
        { name: 'authorUserId', referencedColumnName: 'userId' },
        { name: 'chatId', referencedColumnName: 'chatId' }
    ])
    author!: ChatMemberEntity

    // Пользователь, которому назначена задача
    @ManyToOne(() => ChatMemberEntity, { nullable: true })
    @JoinColumn([
        { name: 'assignedToUserId', referencedColumnName: 'userId' },
        { name: 'chatId', referencedColumnName: 'chatId' }
    ])
    assignedToMember?: ChatMemberEntity

    // Роль, которой назначена задача
    @ManyToOne(() => RoleEntity, role => role.tasks, { nullable: true })
    @JoinColumn({ name: 'assignedToRoleId' })
    assignedToRole?: RoleEntity
}