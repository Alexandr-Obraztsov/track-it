import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ChatEntity } from './Chat'

// Сущность задачи для хранения в базе данных
@Entity('tasks')
export class TaskEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'varchar' })
    title!: string // Название задачи

    @Column({ type: 'text' })
    description!: string // Описание задачи

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

    @Column({ type: 'bigint', nullable: true })
    userId!: number | null // ID пользователя Telegram (для личных задач)

    @Column({ type: 'bigint', nullable: true })
    chatId!: number | null // ID группы (для групповых задач)

    @Column({ type: 'bigint', nullable: true })
    assignedToUserId!: number | null // ID пользователя, которому назначена задача (для групповых задач)

    @Column({ type: 'boolean', default: false })
    isCompleted!: boolean // Статус выполнения задачи

    @ManyToOne(() => ChatEntity, chat => chat.tasks)
    @JoinColumn({ name: 'chatId' })
    chat?: ChatEntity
}